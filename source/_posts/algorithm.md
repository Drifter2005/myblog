---
abbrlink: ''
categories:
- - 算法
- - algorithm
date: '2026-07-25T18:52:49.970100+08:00'
tags:
- python
- 动态规划
title: 动态规划
updated: '2026-07-26T20:59:50.679+08:00'
---
# 动态规划

总的来说，动态规划就是将一个问题拆分为许多小问题，用小问题的答案来得到最终的结果，避免重复计算。

## 序言：

在这之前我的刷题逻辑就是在做题网站上随机跳转，跳到什么题做什么，什么算法我都不清楚，我都是把一个题目扔给ai，学一个某个题的解题思路，昨天霍师傅告诉我可以写一下这个动态规划的汇总，当时我的脑子就有点短路了，动态规划是什么鬼，然后几天我系统搜了一下，原来是DP啊，但是只有前几个类型的还略微熟悉一点，到后面几个类型的DP，就算是橙题做起来都十分吃力，看来算法的学习还是要系统地学，之前我的学习方法完完全全就是野路子，虽然入门快，但是上限被大大拉低了。

原谅我这里放的题目都是绿题以下，因为对我来说这样可能更好的来理解每一个分类的特点吧。

再次感谢霍师傅，如果不是这次可能我根本不会这样学习

## 1.线性DP

**线性动态规划（Linear Dynamic Programming，简称线性DP）是****动态规划中最基础且应用最广泛的类型之一****，其核心特征是****状态转移过程具有明确的线性顺序****，即当前状态仅依赖于前序有限个状态，且状态变量沿单一维度递增。线性DP通常用于解决****单序列（数组或字符串）上的最优化问题****，如最长上升子序列、最大子数组和等经典问题。其****时间复杂度多为O(n²)或O(n)****，通过合理优化可进一步提升效率。**

简单来说就是状态只和前面固定几个位置有关，一维数组一路推到底。

例题：

[[P1091 [NOIP 2004 提高组] 合唱队形 - 洛谷](https://www.luogu.com.cn/problem/P1091)](https://)

这个题的思路就是看右到左能连起来的数量计算出来，然后左到右连起来的数量计算出来，最后加起来计算最大人数，最后n-最大人数就是出列人数

```

import sys
data=sys.stdin.read().split()
n=int(data[0])
s=[int(x) for x in data[1:n+1]]
left=[1]*n
for i in range(n):
    for j in range(i):
        if s[j]<s[i]:
            if left[j]+1>left[i]:
                left[i]=left[j]+1
right=[1]*n
for i in range(n-1,-1,-1):
    for j in range(i+1,n):
        if s[i]>s[j]:
            if right[j]+1>right[i]:
                right[i]=right[j]+1
maxs=0
for i in range(n):
    total=left[i]+right[i]-1
    if total>maxs:
        maxs=total
print(n-maxs)
```

## 2.背包DP

**背包DP是****动态规划中解决资源分配类问题的核心模型****，其核心特征是****在容量限制下通过选择物品实现价值最大化****（或满足其他优化目标）。与线性DP不同，背包DP的状态维度通常包含物品索引**和**容量限制，形成二维递推关系。它是NP完全问题的典型代表，但动态规划能在伪多项式时间**内高效求解（时间复杂度与容量数值相关）。

简单来理解的话，背包DP就是在一个背包中，如何装才能使背包中的总价值最大

例题：

[[B2173 多重背包 - 洛谷](https://www.luogu.com.cn/problem/B2173)](https://)

此时dp[i]代表的是背包容量为i是最大的价值，这个方法不仅天然实现分层，而且可以不断刷到最大值，非常精妙的一种写法（我这不进行最佳写法，只表达出这个题目的思路）

```
import sys
data=sys.stdin.read().split()
n=int(data[0])
V=int(data[1])
idx=2
dp=[0]*(V+1)
for _ in range(n):
    w=int(data[idx])
    v=int(data[idx+1])
    c=int(data[idx+2])
    idx+=3
    for k in range(c):
        for j in range(V,w-1,-1):
            if dp[j-w]+v>dp[j]:
                dp[j]=dp[j-w]+v
print(dp[V])
```

## 3.区间DP

**区间DP是动态规划的一种****特殊类型****，专门用于解决****序列上连续子区间**的最优解问题。其核心思想是：**通过合并更小区间的解，逐步推导出大区间的最优解****。与线性DP（按序列顺序递推）不同，区间DP的****状态定义直接基于区间范围****，且****计算顺序必须按区间长度从小到大进行****。**

简单理解就是：区间DP是处理一段区间上的最优问题，大区间的答案依赖内部小区间的答案（话说这个地方是不是堆也可以实现相关功能，但是堆好像计算中有冗余的存在。

例题：

[[P1775 石子合并（弱化版） - 洛谷](https://www.luogu.com.cn/problem/P1775)](https://)

这个提的主要思路就是将多重背包转化为 0-1 背包，然后倒叙遍历，确保每个物品只能选中一次。

```
import sys
data=sys.stdin.read().split()
n=int(data[0])
s=[int(x) for x in data[1:n+1]]
pre=[0]*(n+1)
for i in range(1,n+1):
    pre[i]=pre[i-1]+s[i-1]
dp=[[0]*n for _ in range(n)]
for l in range(2,n+1):
    for i in range(0,n-l+1):
        j=i+l-1
        dp[i][j]=float('inf')
        t=pre[j+1]-pre[i]
        for k in range(i,j):
            cost=dp[i][k]+dp[k+1][j]+t
            if cost<dp[i][j]:
                dp[i][j]=cost
print(dp[0][n-1])
```

## 4.记忆化搜索DP

**记忆化搜索DP（Memoization in Dynamic Programming）是动态规划的一种实现方式，其核心思想是****通过递归求解子问题，并用缓存（如字典或数组）存储已计算的结果，避免重复计算****。它与传统递推式DP（自底向上填表）不同，采用****自顶向下**的递归思路，但通过记忆化机制保留了动态规划“避免重复子问题”的本质优势。

简单来说记忆化搜索是递归加缓存，把递归过程中计算过的结果存起来，下次再遇到直接返回，避免重复计算。

例题：

[[P14337 [JOI2020 预选赛 R2] 求和 / Digit Sum - 洛谷](https://www.luogu.com.cn/problem/P14337)](https://)

这个题目很有意思，刚看到题目一脸懵逼，愣是没有一点思路，还是在题解之后找到思路，但是好像也不是很难

核心思路是利用动态规划逆向统计路径：用数组f[i]表示能通过操作（至少一步）到达i的起始数个数（起始数必须小于i）。从1到n遍历每个数i，计算其操作后结果nx = i + digit\_sum(i)，若nx未超出合理范围（≤n+81），则将f[i]+1累加到f[nx]。最终结果f[n]表示能到达n的起始数个数（不含n自身），因此输出额外加上起始数n自身的情况。

data=sys.stdin.read().split()
n=int(data[0])
f=[0]+82
for i in range(1,n+1):
    t=i
    sum1=0
    while t>0:
        sum1+=t%10
        t//=10
    nx=i+sum1
    if nx<=n+81:
        f[nx]+=f[i]+1
print(f[n]+1)
## 5.状态压缩 DP

**状态压缩动态规划（State Compression DP）是一种将集合状态用二进制数编码的动态规划技术，核心思想是****用整数的二进制位表示元素的选中状态****（如第i位为1表示第i个元素被选中），从而将集合操作转化为高效的位运算。它适用于状态中包含****小规模集合信息**的问题（通常元素数量≤20，因2²⁰≈1e6在可接受范围内），典型场景包括集合覆盖、排列组合优化、图论中的子集路径问题等。

简单来说：用**二进制位**来表示某些元素的**选择状态**（选/没选、走过/没走过），把一维状态"压缩"成一个整数。（按照我的理解的话就是带着True 和False的DP）

例题：

[[P1595 信封问题 - 洛谷](https://www.luogu.com.cn/problem/P1595)](https://)

这个题目比较简单，但是应该能也能体现状压DP的特点吧

```
import sys
data=sys.stdin.read().split()
n=int(data[0])
if n==1:
    print(0)
elif n==2:
    print(1)
else:
    a,b=0,1
    for i in range(3,n+1):
        a,b=b,(i-1)*(b+a)
    print(b)
```
## 6.树形DP

**树形动态规划（Tree DP）是在树结构上进行的动态规划，核心思想是****利用树的递归特性，通过子树的解推导整棵树的解****。树的无环连通性质保证了状态转移无后效性（子树间无交叉依赖），使得动态规划能自然适配树的层次结构。其典型实现是****后序遍历****（先处理所有子节点，再处理父节点），确保计算父节点状态时子节点状态已确定。**

这是我第一次尝试这个树形DP的题目，按照我的简单理解就是在树的结构上继续动态规划，树形DP是后序遍历（先处理完所有子节点然后再处理父亲节点）

这是一般模板

```
def dfs(u, parent):
    """处理以 u 为根的子树，parent 是 u 的父节点，防止往回走"""
  
    # 1. 初始化 u 的状态
    dp[u][某状态] = 初始值
  
    # 2. 遍历所有子节点
    for v in tree[u]:          # tree[u] 存 u 的所有邻居
        if v == parent:        # 跳过父节点，防止循环
            continue
        dfs(v, u)              # 先递归处理子节点
  
    # 3. 根据子节点的结果，更新 u 的状态
    for v in tree[u]:
        if v == parent:
            continue
        dp[u][某状态] = 组合(dp[v][某状态])
```
例题：

[[P1481 魔族密码 - 洛谷](https://www.luogu.com.cn/problem/P1481)](https://)

这是一个简单的树形DP题目（其实用线性DP也能做，但是我觉得这个用来方便理解树形DP很好，在这里就放一下这个题）

首先用用二维数组`child`存储树结构，每个节点代表一个字符，路径表示字符串，对每个字符串，沿Trie树查找其所有前缀中已存在的最长链长度（`best`），并将当前字符串的链长设为`best + 1`，`ml[u]`记录以节点`u`结尾的字符串能形成的最长链长度。插入字符串时，若路径上某节点已有链长`ml[u]`，则当前字符串可延续该链（`curl = best + 1`），并更新终点的`ml[u]`。 最终输出所有字符串中能形成的最长链长度（**`ans`）。本质是利用Trie高效匹配前缀关系，避免暴力枚举子序列。

```
import sys
data=sys.stdin.read().split()
n=int(data[0])
s=data[1:n+1]
maxn=2000*75+5
child=[[0]*26 for _ in range(maxn)]
ml=[0]*maxn
nc=0
ans=0
for i in range(n):
    u=0
    best=0
    for ch in s[i]:
        c=ord(ch)-97
        if child[u][c]==0:
            nc+=1
            child[u][c]=nc
        u=child[u][c]
        if ml[u]>best:
            best=ml[u]
    curl=best+1
    ml[u]=curl
    if curl>ans:
        ans=curl
print(ans)
```
## 7.数位DP

**数位动态规划（Digit DP）是一种专门处理****与数字各位数字相关性质****（如数字和、特定数字出现次数、数字模式等）的动态规划技术。其核心思想是****将数字视为字符串，按位决策构建满足条件的数字****，通过记忆化搜索避免重复计算子问题。适用于统计区间**`[L, R]`内满足特定数位条件的整数个数（如"不含49的数字"、"数字和为质数的数"等），本质是**用动态规划高效枚举数字的各位组合**

简单理解就是按照数位 来进行动态规划，把数字分开，按位处理

例题：

[[P10697 [SNCPC2024] 消失的数字 - 洛谷](https://www.luogu.com.cn/problem/P10697)](https://)

这个题，em~很牛逼的一个题，这个方向我也是第一次了解，在题解中尽量理解这个思路，我快气死了，今天做的这些题怎么感觉这么不顺利，果然我还是一条本质菜逼，经过大量尝试，按照题解思路来还是超时，给他了，我放弃这个题了，为什么一个橙题做起来这么怪呢，这个题目先放在这，等哪天我再试试看看能不能做出来。

[[P1708 [入门赛 #21] 星云 hard ver. - 洛谷](https://www.luogu.com.cn/problem/P1708)](https://)

还是来试试这个吧，虽然这是个黄题，但是感觉比上一个简单一点，放一个ai版的吧，自己写的下次不一定还能看懂😓

核心思路是动态规划+前缀和优化：先用DP表`dp[length][s]`记录长度为`length`、数字和恰好为`s`的数字数量（通过逐位累加低位结果构建），再转为前缀和形式表示"数字和≤s"的计数，最后汇总所有长度≤n的情况到`ans[n][k]`中。查询时直接查表输出结果，避免实时计算，将单次查询复杂度降至O(1)。本质是用空间换时间，通过预处理覆盖所有可能的输入范围（n≤7, k≤100）。

```
import sys

MAX_N = 7
MAX_K = 100

# 预处理
dp = [[0] * (MAX_K + 1) for _ in range(MAX_N + 1)]
for d in range(1, 10):
    dp[1][d] = 1

for length in range(2, MAX_N + 1):
    for s in range(1, MAX_K + 1):
        for d in range(10):
            if s >= d:
                dp[length][s] += dp[length-1][s-d]

# 前缀和
for length in range(1, MAX_N + 1):
    for s in range(1, MAX_K + 1):
        dp[length][s] += dp[length][s-1]

# ans[n][k]
ans = [[0] * (MAX_K + 1) for _ in range(MAX_N + 1)]
for n in range(1, MAX_N + 1):
    for k in range(1, MAX_K + 1):
        for length in range(1, n + 1):
            ans[n][k] += dp[length][k]

# 查询
data = sys.stdin.buffer.read().split()
T = int(data[0])
out = []
idx = 1
for _ in range(T):
    n = int(data[idx])
    k = int(data[idx + 1])
    idx += 2
    out.append(str(ans[n][k]))

sys.stdout.write('\n'.join(out))
```
## 8.期望DP

**期望动态规划（Expectation DP）是动态规划在****概率与期望问题**中的特殊应用，核心思想是**将状态定义为随机事件的期望值****，通过建立期望之间的递推关系求解问题。其本质是利用****期望的线性性质****（无论事件是否独立，和的期望等于期望的和）将复杂随机过程拆解为子问题的期望组合，避免直接处理概率分布的高复杂度计算。**

简单来说就是用DP求某个随机过程的期望值

没找到相关的题目，用这个来继续理解吧

**问题**：不断掷一个公平骰子，累积点数，当总点数 ≥ n 时停止。求期望掷骰次数。

```
n = int(input())
dp = [0] * (n + 6 + 1)  
for i in range(n - 1, -1, -1):
    total = 0
    for d in range(1, 7):
        total += dp[i + d]
    dp[i] = 1 + total / 6
print(dp[0])
```
