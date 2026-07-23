---
title: Crypto观测笔记：RSA小指数与广播攻击
date: 2026-07-04 20:40:00
categories:
  - CTF
tags:
  - Crypto
  - RSA
  - number-theory
  - CTF
---
RSA 的安全性依赖大整数分解困难，但 CTF 题目常常不会直接让你分解 `n`，而是通过错误参数、重复消息或填充缺失制造侧信道。

## 小指数风险

当 `e = 3` 且明文 `m` 很小，如果没有填充，可能出现：

```text
c = m^3 mod n
m^3 < n
```

此时模运算没有真正发生，直接对 `c` 开三次方即可得到 `m`。

## 广播攻击

如果同一个明文使用相同小指数 `e = 3` 加密给三个不同模数，且模数两两互素，可以用中国剩余定理恢复 `m^3`：

```python
from Crypto.Util.number import long_to_bytes

M = crt([n1, n2, n3], [c1, c2, c3])
m = integer_nthroot(M, 3)[0]
print(long_to_bytes(m))
```

## 复盘清单

- 检查 `e` 是否过小，尤其是 `3`、`5`、`17`。
- 检查是否多组密文对应同一明文。
- 检查不同 `n` 是否存在公共因子：`gcd(n1, n2) > 1`。
- 检查是否缺少 OAEP 等安全填充。

密码学题目最迷人的地方在于它的严谨性：每一个漏洞都对应一个被破坏的数学前提。