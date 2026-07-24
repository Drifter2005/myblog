---
abbrlink: ''
categories:
- - CTF
date: '2026-07-24T16:37:42.322079+08:00'
tags:
- web
title: 哈希绕过+变量覆盖
updated: '2026-07-24T16:37:42.584+08:00'
---
# 哈希绕过****

## 0E绕过弱比较

```

<?php
if ($_GET['name'] != $_GET['password'] &&
MD5($_GET['name']) == MD5($_GET['password'])){
    echo "flag";
}

```

PHP在处理哈希字符串时，它把每一个以“0E”开头的哈希值都解释为0，所以如果两个不同的密码经过哈希以后，其哈希值都是以“0E”开头的，PHP会当作科学计数法来处理，也就是0的n次方，得到的值比较的时候都相同。

这种方式只有在弱比较的时候才能使用。


**以下值在md5加密后以0E开头：**

* QNKCDZO
* 240610708
* s878926199a
* s155964671a
* s214587387a
* s214587387a

**以下值在sha1加密后以0E开头：**

* aaroZmOk
* aaK1STfY
* aaO8zKZF
* aa3OFF9m
* 0e1290633704
* 10932435112

双重MD5加密后0E开头：

* 7r4lGXCH2Ksu2JNT3BYM
* CbDLytmyGm2xQyaLNhWn
* 770hQgrBOjrcqftrlaZk

还有的时候会限制字符串为纯数字或字母，这些特殊条件的字符串可以自行搜索。

## 数组绕过

对于php强比较和弱比较：[md5](https://so.csdn.net/so/search?q=md5&spm=1001.2101.3001.7020)()，sha1()函数无法处理数组，如果传入的为数组，会返回NULL，所以两个数组经过加密后得到的都是NULL，也就是相等的。

```
<?php
$a=$_GET['a'];
$b=$_GET['b'];
if ($a!==$b && md5($a)===md5($b)){
    echo "flag";
}
```


GET情况下的payload(POST同理)：

<pre class="highlighter-hljs ruby mCustomScrollbar _mCS_3 mCS-autoHide mCS_no_scrollbar" data-dark-theme="true" highlighted="true" id="pre-xNK4pF"><div id="mCSB_3" class="mCustomScrollBox mCS-minimal-dark mCSB_vertical_horizontal mCSB_outside" tabindex="0"><div id="mCSB_3_container" class="mCSB_container mCS_y_hidden mCS_no_scrollbar_y mCS_x_hidden mCS_no_scrollbar_x" dir="ltr"><code-pre class="code-pre" id="pre-Zn3yN6">?a[]=1&b[]=2</code-pre></div></div></pre>

## MD5碰撞

```
<?php
show_source(__FILE__);
if((string)$_POST['a']!==(string)$_POST['b'] && 
  md5($_POST['a'])===md5($_POST['b'])){
    echo "flag";
}


```

比较a，b时将a，b转换为字符串比较，这边就不能用数组了。因为数组转换为字符串时都会变成Array。

因为数组要求构造a和b不同，但是MD5相同，也就是说要求传入两个MD5相同的不同字符串。所以我们只能用MD5碰撞来实现

MD5截断爆破

给出一段md5值要求找到匹配的原码。一般使用爆破脚本：

```
import hashlib
from multiprocessing.dummy import Pool as ThreadPool

# MD5截断数值已知 求原始数据
# 例子 substr(md5(captcha), 0, 6)=60b7ef

def md5(s):  # 计算MD5字符串
    return hashlib.md5(str(s).encode('utf-8')).hexdigest()


keymd5 = '8ffb1'   #已知的md5截断值
md5start = 0   # 设置题目已知的截断位置
md5length = 5

def findmd5(sss):    # 输入范围 里面会进行md5测试
    key = sss.split(':')
    start = int(key[0])   # 开始位置
    end = int(key[1])    # 结束位置
    result = 0
    for i in range(start, end):
        # print(md5(i)[md5start:md5length])
        if md5(i)[0:5] == keymd5:            # 拿到加密字符串
            result = i
            print(result)    # 打印
            break


list=[]  # 参数列表
for i in range(10):   # 多线程的数字列表 开始与结尾
    list.append(str(10000000*i) + ':' + str(10000000*(i+1)))
pool = ThreadPool()    # 多线程任务
pool.map(findmd5, list) # 函数 与参数列表
pool.close()
pool.join()
```

sha256截断爆破

```
import hashlib
from multiprocessing.dummy import Pool as ThreadPool

# sha256截断数值已知 求原始数据
# 例子 substr(sha256(captcha), 0, 6)=60b7ef

def sha256(s):  # 计算sha256字符串
    return hashlib.sha256(('TQLCTF'+str(s)).encode('utf-8')).hexdigest()


keysha256 = '5625f'   #已知的sha256截断值
sha256start = 0   # 设置题目已知的截断位置
sha256length = 5

def findsha256(sss):    # 输入范围 里面会进行sha256测试
    key = sss.split(':')
    start = int(key[0])   # 开始位置
    end = int(key[1])    # 结束位置
    result = 0
    for i in range(start, end):
        # print(sha256(i)[sha256start:sha256length])
        if sha256(i)[0:5] == keysha256:            # 拿到加密字符串
            result = i
            print(result)    # 打印
            break


list=[]  # 参数列表
for i in range(10):   # 多线程的数字列表 开始与结尾
    list.append(str(10000000*i) + ':' + str(10000000*(i+1)))
pool = ThreadPool()    # 多线程任务
pool.map(findsha256, list) # 函数 与参数列表
pool.close()
pool.join()
```

# 变量覆盖****

用传参的值覆盖掉原有的值

## extract()函数

[[PHP extract() 函数 | 菜鸟教程](https://www.runoob.com/php/func-array-extract.html)](https://)

实例：

将键值 "Cat"、"Dog" 和 "Horse" 赋值给变量 \$a、\$b 和 \$c：

```
<?php
$a = "Original";
$my_array = array("a" => "Cat","b" => "Dog", "c" => "Horse");
extract($my_array);
echo "\$a = $a; \$b = $b; \$c = $c";
?>
```


extract() 函数从数组中将变量导入到当前的符号表。

该函数使用数组键名作为变量名，使用数组键值作为变量值。针对数组中的每个元素，将在当前符号表中创建对应的一个变量。

该函数返回成功设置的变量数目。

## parse_str()

[[PHP parse\_str() 函数 | 菜鸟教程](https://www.runoob.com/php/func-string-parse-str.html)](https://)

把查询字符串解析到变量中：

```
<?php
parse_str("name=Peter&age=43");
echo $name."<br>";
	echo $age;
?>
```


parse\_str() 函数把查询字符串解析到变量中。

**注释：**如果未设置 array 参数，由该函数设置的变量将覆盖已存在的同名变量。**注释：**php.ini 文件中的 magic\_quotes\_gpc 设置影响该函数的输出。如果已启用，那么在 parse\_str() 解析之前，变量会被 addslashes() 转换。
