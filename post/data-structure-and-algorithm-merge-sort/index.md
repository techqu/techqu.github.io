
<!--more-->



## 归并排序的原理

归并排序的核心思想还是蛮简单的。如果要排序一个数组，我们先把数组从中间分成前后两部分，然后对前后两部分分别排序，再将排好序的两部分合并在一起，这样整个数组就都有序了。


![mergeSort](/img/mergeSort.jpg)


**分治是一种解决问题的处理思想，递归是一种编程技巧**


我们先写出归并排序的递推公式。

```
递推公式：
merge_sort(p…r) = merge(merge_sort(p…q), merge_sort(q+1…r))

终止条件：
p >= r 不用再继续分解
```
merge 函数

![mergeFunc](/img/mergefunc.jpg)

```java
/**
 *
 */
public class MergeSort {
    public static void main(String []args){
//        int []arr = {9,8,7,6,5,4,3,2,1};
        int [] arr = {1,4,2,8,20,23,12};
        sort(arr);
        System.out.println(Arrays.toString(arr));
    }
    public static void sort(int []arr){
        //在排序前，先建好一个长度等于原数组长度的临时数组，避免递归中频繁开辟空间
        int []temp = new int[arr.length];
        sort(arr,0,arr.length-1,temp);
    }
    private static void sort(int[] arr,int left,int right,int []temp){
        System.out.println("array:"+Arrays.toString(arr)+",temp:"+Arrays.toString(temp)+",left:"+left+",right:"+right);
        if(left<right){
            int mid = (left+right)/2;
            //左边归并排序，使得左子序列有序
            sort(arr,left,mid,temp);
            //右边归并排序，使得右子序列有序
            sort(arr,mid+1,right,temp);
            //将两个有序子数组合并操作
            merge(arr,left,mid,right,temp);
        }
    }
    private static void merge(int[] arr,int left,int mid,int right,int[] temp){
        //左序列指针
        int i = left;
        //右序列指针
        int j = mid+1;
        //临时数组指针
        int t = 0;
        while (i<=mid && j<=right){
            if(arr[i]<=arr[j]){
                temp[t++] = arr[i++];
            }else {
                temp[t++] = arr[j++];
            }
        }
        //将左边剩余元素填充进temp中
        while(i<=mid){
            temp[t++] = arr[i++];
        }
        //将右序列剩余元素填充进temp中
        while(j<=right){
            temp[t++] = arr[j++];
        }
        t = 0;
        //将temp中的元素全部拷贝到原数组中
        while(left <= right){
            arr[left++] = temp[t++];
        }
    }
}

```