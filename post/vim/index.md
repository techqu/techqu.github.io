
编辑器之神-vim
神的编辑器-emacs

最近开始使用vim键盘流，原因是写代码时真心不想再去碰鼠标，来回切换很麻烦。以下是记录了一些常用但是我不会的快捷键
<!--more-->
## 环境准备
- 安装vim
- sublime、vscode、idea等编辑器安装vim插件

## 学习方法论
- 一个前提：键盘映射
- 一个定则：2 8 
- 一个要求：不用鼠标
- 一个方法：刻意练习
- 一个重要的事情：得不到重复的技能回遗忘
- 一个终极目标：写作速度与思维速度一致

## 知识点
### 1. 选中模式 

v V ctrol-v

### 2. 基于单词的移动 

 词首w b     词尾e ge

### 3. 基于字符的查找移动 

f F   所在   ; 重复  ,回退

t  T 之前   ; ,

### 4. 文本对象

#### 分隔符文本对象

ib 小括号

ab

iB i} 花括号

aB a}

i>

a>

#### 范围文本对象

iw word
aw
is sentence
as
ip part
ap

i-in
a-around


### 5. 操作符待决模式

d{motion} delete

c{motion} change

y{motion} yank

v   view

### 6. 设置标记、快速回跳

m{mark}

`{mark}

### 7. 复制 粘贴 翻页

y 

p 

ctrol f b \ d u

### 8. 查找替换

*
#

:set hls

/pattern  n跳转

:%s/pattern/string/g 使用c替换确认

在命令行模式下，实现替换7，8行的字符b,用字符a替换字符b

输入：7，8s/b/a/g

其中：b就是旧的（之前的）字符
    a是新的（现在的）字符

### 9.分屏
垂直：vs  close 
水平：sv
切屏：ctrl+w+w

### 10.滑动屏幕
zt
zz 滑动屏幕使当前行置于屏幕中央
zb

### 11.大小写
~
gu
gU



## 改善编程体验: IdeaVimExtension介绍

Intellij IDEA是个非常优秀的开发环境,提供了相当好用的快捷键,让用户有机会脱离鼠标来使用IDE.

另外官方还提供了IdeaVim插件,熟悉vim的用户可以使用几乎与vim相同的方式操作IDEA的编辑器来编写代码.但是作为非英文用户,却有一个"输入法切换"的痛点.

考虑如下两种情况:

编辑器中在insert模式下,编写了一段中文注释,然后需要回到normal模式移动光标到其他位置继续编写代码.
正在编辑器normal模式下操作,此时突然有紧急邮件或者钉钉消息需要回复,输入法切换为中文回复后再回到编辑器.
类似上面两种场景,当回到normal模式编辑器时,我们都不得不人工操作一次输入法切换,即使您已经为输入法切换设置了非常好用的快捷键(按一下Shift),这个操作依然是恼人的,经常会忘记,输入几个字符后才发现,这可能带来误操作.

我们的期望只有一个:

在任何情况下,进入normal模式,输入法必是英文状态.

因此我基于IdeaVim的扩展点开发了一个帮助切换输入法的小插件IdeaVimExtension

### IdeaVimExtension安装使用

如果您已经是IdeaVim的用户,那么直接在Intellj IDEA的插件中心搜索IdeaVimExtension进行安装.或者到IdeaVimExtension插件主页进行下载安装.
IdeaVimExtension是依赖IdeaVim的,需要事先安装IdeaVim

确保你的操作系统已经开启了英文输入法

Windows需要开启en_US输入法
macOS需要开启ABC或en_US输入法
Linux 不支持
安装重启IDEA后,打开任意代码编辑器在normal模式下输入如下两个命令来激活IdeaVimExtension插件

- :set keep-english-in-normal : 在normal模式保持英文状态
- :set keep-english-in-normal-and-restore-in-insert : 在normal模式保持英文状态,并在回到insert时恢复输入法到原来的状态.例如,编写一段中文注释,用中文输入法写了一段文字,进入normal模式移动光标到下一行,再回到插入模式继续使用中文编辑.

上面两个命令在每次IDEA重启后都需要重新输入,也可以通过在用户目录下添加 .ideavimrc文件,将命令添加到该文件中,这样在IDEA重启时可以自动执行该文件中的指令.另外,该文件中也可以添加其他受支持的vim指令.类似vim的.vimrc文件.


https://blog.csdn.net/u012260238/article/details/81141158