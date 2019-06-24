
I recently started learning about domain driven design, CQRS and event sourcing. Up until now, I have been mostly involved in projects that use a ‘classic’ N tier/layer architecture with a relational database. As projects become more complex, I noticed that this model doesn’t always work well.  A while ago, I wrote an article about the N-layer myth which already exposed some of the issues I feel this type of architecture has. The first thing I tried was applying domain driven design within such an architecture.

<!--more-->


## Domain driven design
So, what is domain driven design actually? In domain driven design, language is the most important factor. What you want to have is the problem domain explicitly expressed inside your code. In essence, as a developer, you want to speak the same language as your business.
Domain driven design can be very simple or very complex. The following is the simplest example I could think of:
```java

    var acc = new Account();
    var acc2 = new Account();
acc.Balance+=10;acc2.Balance-=10;

public class Account {
    public decimal Balance
    {
        get;
        set;
    }
}
```
Here, the logic lives outside of our Account-class. There’s no notion of a transfer and it’s just simply adding and subtracting. This is more of a procedural coding style where you’re just manipulating data. The next snippet shows a very simplistic form of using language to make the behavior explicit (also notice the setter is now private):

```java

    var acc = new Account();
    var acc2 = new Account(); 
    acc.TransferMoneyTo(acc2,10);

public class Account {
    public decimal Balance

    {
        get;
        private set ;
    }

    public void TransferMoneyTo(Account other, decimal amount) {
        Balance += amount;
        other.Balance -= amount;
    }
}

```
Now, obviously there’s much more to domain driven design then this, but the essence is the focus on language and making the implicit explicit.

### The problem with DDD and the typical N-layer architecture

While applying DDD to a classic N layer architecture I ran into a few issues and I came to the conclusion to DDD is nearly impossible in such an architecture.

The first reason that I feel true DDD is impossible, is that all your descriptive domain language gets obfuscated by handling the persistence. Sure, we have ORM-frameworks, like Entity Framework and NHibernate, but you still need a lot of mapping and infrastructure code which takes away focus of the domain model. An ORM also doesn’t always allow you to map your domain model to a database model either (as an example see this question by me on Stack Overflow: How to map a Value Type which has a reference to an entity?).
So you need to introduce changes in your domain model to accommodate for the database. This is a leaky abstraction, which in my opinion is worse then no abstraction at all.
Having a single database model not only forces you to map your domain to a database model, but it also forces you to map your domain model to views. The code needed to do all this kind of mapping rapidly obfuscates your domain language.

Secondly, since we’re dealing with a relational database, we tend to design from the bottom up. When we think about our domain model, we think in data-models (ie: one-to-many, may-to-many). We know the constraints and thus when we model, we unknowingly model towards these constraints. While a data model can give you some good information about the domain, I feel a behavioral model is much more valuable.

A third reason that it makes our design more complicated then it should be is that we think we need immediate consistency. This seems an important issue but I think we’re putting too much value on immediate consistency. We trick ourselves into thinking that if we have a single source of truth (the database), we always have immediate consistency. The reality is, we are already in a state of eventual consistency. Think about a simple use case: a user edits a product description. In the time between reading the product from the database and the user saving the new value, there’s already a window for someone to change that product or maybe even delete it. We ignore these cases because they are rare. Isn’t it strange that we consider immediate consistency to be a priority but then ignore the cases where it goes wrong? Maybe it’s not all that important after all.

Given these problems, I notice more and more that domain driven design is not possible with a classic layered architecture. Even when using well-known patterns like Repositories, Unit of work and the likes, you almost always end up either with a thick layer of services and an anemic domain model (think lots of getters and setters and no methods) or with a domain model that is handling too many things (think data access code inside your entities).

### Is there a better solution?
Given these issues I wondered whether there was a better approach, so I started looking into CQRS and event sourcing. I’m still in the early phases of the learning process and at first sight it looks complicated. The reason for that is that it’s a big shift from the classic approach. What I want to accomplish with this blog post is describe these approaches, give an overview of what such an architecture looks like and show the opportunities it presents.

## CQRS
CQRS stands for “Command Query Responsibility Segregation”. It means that you should separate reading and writing into two different parts of your application.

In a layered architecture, our domain is expressed in a set of (usually data-centric) classes. On top of that, there is a layer of services that persist these objects into the database and retrieve them (usually via a repository and a unit of work-pattern). In general, reading and writing are treated the same way. Objects pass through the same layers and get transformed on their way up to the view and down to the database. The following diagram shows a generic example of what happens when you read or write:

[![image](/content/images/2013/12/image_thumb31.png "image")](/content/images/2013/12/image31.png)

All objects pass through the same layers, undergoing all the same **transformations** when we’re writing and when we’re reading. When we write, we **map** from a view model to a domain entity and then the ORM maps the entity to a database table. When reading, we do the opposite transformation. This is a very **data-driven** approach. Is all this mapping really necessary?
With CQRS, we basically treat reading and writing very differently. The following diagram shows an example of the read and the write side in a CQRS model:

[![image](/content/images/2013/12/image_thumb41.png "image")](/content/images/2013/12/image41.png)
 
The writing goes as follows:

1. The view constructs a command and passes it to a command handler.
2. The command handler then applies that command to a domain class.
3. The domain class sends out an event with what happened
4. An event handler catches these events and persists the changes.
5. The read side is very simple: each view has a dedicated ‘source’ (this could be a simple table or a view).

At first, this whole idea seemed very odd to me and I saw some problems with it:

- Aren’t we introducing more layers on the write side?
  Yes, but these are very thin layers. The only thing the command handler does is accept a command and find the correct entity (or aggregate if we’re speaking DDD) to apply the command to.
  The event handler is only charged with applying changes to the database.
- How do you apply logic to the data that the view gets?
  The idea behind this concept is that the domain layer prepares the data. When the event handler receives the changes in the data, it can handle that in different ways. One way would be to just save the values in the database. However, it could also decide to save a view optimized form of that same data to a secondary storage. That way, when the view gets it, it’s already processed.

After I realized that these problems weren’t actually that difficult to overcome I saw the advantages this system offers:

- The command handler takes away a lot of the logic that we would normally put in services and puts it back into the domain model, where it belongs.
- The event handler takes all of the persistence logic out of the domain model.
- As a result the domain model is focused on one thing: domain logic.
- The read side can be much more efficient, since it can go to the database directly (with optimized data access code) and get preprocessed data. This is a big benefit since reading is done an order of magnitude more than writing (consider how many tweets you send versus how many you read).
- If you were to separate the application in different tiers (as opposed to layers) you can scale the read and the write side independently. This is a huge benefit, because usually you need to scale because one of the sides is getting slow (usually the read side).
- Apart from separating the read and write side into different tiers, it’s also easier to separate the horizontal layers. The commands and events that are sent are just POCO’s and they can easily be serialized over the wire.
- Since commands and events are easily serializable, you can store them them as well. This gives you a lot of possibilities such as logging and auditing. Event sourcing is also based on this capability.

## Event sourcing
So then, what is event sourcing? Event sourcing is another shift in paradigm, which blew me away at first. When using a regular database, we usually create a record in the database and then perform some updates on that same record, read it a few times until it eventually gets deleted. Essentially we’re always saving the latest snapshot of the data. If you take a step back, you see that actually we’re deleting data all the time. Whenever you perform a delete or an update in your database you are deleting data. Think about that for a moment, do you really want to delete data? How do you know that in few months time this data is not going to be important?

There are a few approaches to prevent deleting data (such as doing a soft delete) but all of them focus on actual deletes. An update is also a delete. Furthermore a soft delete still only keeps the last available snapshot in the database. Frankly, I have seen this technique being used a lot. I have hardly seen a recovery from such a record though, since it’s probably not the snapshot you wanted anyway.

What if we save all the snapshots, meaning every state our data has ever been in?

A better approach is to save the deltas between each version. When we use events and look at all the events that were ever submitted for a certain entity, could we reproduce our entity in whatever state it has ever been? Sure we can, and that is exactly what event sourcing is. So, instead of inserting data, updating it and deleting it, our system now only does inserts. Doesn’t that sound a lot easier? Let me repeat that, we now only do inserts!!

Let’s see an example of what an event log looks and how that translates to the state of an object.

[![image](/content/images/2013/12/image_thumb21.png "image")](/content/images/2013/12/image21.png)

In this diagram you can see we have three events: *ProductCreated*, *ProductPriceUpdated* and *ProductRenamed*. If, instead of saving the product that resulted from these events, we’d store the events themselves, we can **recreate** the Product at any given time by just walking up the stack and applying each **transformation**. This is the basic concept behind event sourcing.
While this seems highly inefficient, it means that we can now get the state of an entity at any given point in history. Not deleting any data opens up really interesting scenarios. Let’s take a look at an example.

Suppose your company sells furniture and you have a customer database. Marketing regularly wants us to send out a promotion to everyone who has changed their address in the last year because they are likely to buy new furniture.

In a typical architecture, to solve this need, you add a field in the database (“lastAddressModification”), you add the same field to the customer and if necessary modify your persistence mechanism. In your service layer, you add a check to see whether the address has changed and if so you update the field. All is well, and from now, whenever someone changes their address they’ll get a promotion. From now on! What did you have to do to get this working? You had to modify the database, make changes to the persistence mechanism (either mapping or SQL queries), modify your domain objects and the service layer.

Consider implementing this with event sourcing. Since you have all the events, you only need to do one thing: when you walk up the stack of events, you check whether an event occurred in the last month which involved an address change. The moment you implement this feature, it will start working and it will start working retroactively for events that occurred before you implemented this functionality.

This method can be very useful for all kinds of functionality that we considered impossible. An answer I usually hear is that there’s no need for this and that the business doesn’t ask for this. I think the reason is that we trained them not to ask for it, because we considered it impossible.

### Performance
As I said, this seems highly inefficient, and it can be. When you have a lot of events for a certain entity, it can take a while to walk up the stack. One thing to consider is that you only need to this when you receive a command. In all other cases the data will be available in a denormalized form, optimized for reading (a snapshot). However, if you happen to have hundreds of events (which is unlikely), it can still be slow. A solution for that problem takes us back to where we started, albeit with a small difference. We can store snapshots.

Now instead of travelling the stack from the bottom up, we travel from the top until we find a snapshot. Then we apply all the events that happened after that snapshot to get to the current state. In case you need to access other historical data (such as in the previous example) you can still do the bottom up approach though.

This solution works, but if possible I think it should be avoided. The reason is that you are creating a dependency on your snapshots. If you don’t have snapshots, your domain model can vary as much as you want. As long as you still know how to apply a past event to it, you can modify whatever you want. If you work with snapshots you create a dependency on that snapshot and you have to take it into account when you modify the domain model. A possible solution for that is to recalculate the snapshots when your domain changes, but that’s again adding overhead, which you’d want to avoid as much as possible.

### Conclusion
Domain driven design, CQRS and event sourcing are really interesting and powerful techniques. Instead of solving complex problems they approach it from a different perspective so that they become simple problems.
Would I use it in any application? No, I think the domain needs to be complex enough in order to get benefit out of it. That being said, I don’t consider myself experienced enough to recommend at which point it becomes beneficial or not. I guess time will tell that.
I hope in this post I have been able to give you a bit of an overview of what DDD, CQRS and event sourcing is.

> Note: Given that these topics are relatively new to me, why would I write a blog post about it?
The first reason is that I want to vocalize what I have learnt so far, it helps me understand things better. Secondly, when looking for information, it took me a while to get the big picture and I think I get it now, so I want to write it down for anyone who is in the same situation as I am.
And last but not least, this is kind of an open-ended question to experts in the field to see whether I’m making any incorrect assumptions. So any comments, criticism and suggestions are more then welcome.