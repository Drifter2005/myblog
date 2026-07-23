---
title: Reverse入门巡天：从字符串到控制流
date: 2026-07-04 21:00:00
categories:
  - CTF
tags:
  - Reverse
  - binary
  - CTF
  - debugging
---
逆向分析不要急着“看懂全部”。更稳的方式是像天文观测一样分层扫描：先找明亮信号，再建立坐标系，最后锁定关键路径。

## 第一轮：静态信号

```text
file ./challenge
strings -a ./challenge | less
checksec ./challenge
```

关注内容：

- 是否有 `flag`、`wrong`、`success` 等提示字符串。
- 是否启用 PIE、Canary、NX、RELRO。
- 是否存在压缩壳、混淆或异常节区。

## 第二轮：函数与分支

在 IDA、Ghidra 或 Binary Ninja 中，优先定位：

- `main`、`check`、`verify`、`decrypt` 等语义函数。
- 字符串交叉引用。
- 输入长度检查、循环、异或、查表和哈希比较。

## 第三轮：动态验证

```gdb
b *main
run
ni
x/s $rdi
p/x $rax
```

动态调试的价值不是替代静态分析，而是验证假设。每次断点都应该回答一个具体问题：输入在哪里？如何变换？在哪里比较？失败分支在哪里？

## 复盘模板

| 阶段 | 记录内容 |
| --- | --- |
| 样本信息 | 架构、保护、哈希、运行参数 |
| 关键函数 | 输入、变换、比较、输出 |
| 解题路径 | 静态依据、动态证据、脚本 |
| 防护思考 | 混淆、反调试、边界检查 |

逆向的终点不是“猜出 flag”，而是把二进制的行为还原成清晰、可解释、可复现的模型。