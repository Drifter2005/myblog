---
title: 图搜索观测笔记：BFS、Dijkstra 与状态空间
date: 2026-07-04 20:10:00
categories:
  - algorithm
tags:
  - BFS
  - Dijkstra
  - graph
  - shortest-path
---
图搜索问题的核心不是“套模板”，而是确认状态、边权和剪枝是否被正确建模。只要模型错了，复杂度再漂亮也会偏离真实答案。

## BFS：等权宇宙中的波前扩散

BFS 适合所有边权相等的最短路。它的正确性来自队列的层序性质：第一次访问某个状态时，已经抵达该状态的最短步数。

```cpp
queue<int> q;
vector<int> dist(n, -1);
dist[s] = 0;
q.push(s);

while (!q.empty()) {
    int u = q.front();
    q.pop();
    for (int v : g[u]) {
        if (dist[v] != -1) continue;
        dist[v] = dist[u] + 1;
        q.push(v);
    }
}
```

检查点：

- 状态是否唯一表示，例如 `(x, y, keyMask)` 而不只是 `(x, y)`。
- 是否存在传送门、钥匙、方向、剩余体力等隐藏维度。
- 图是否真的等权；如果代价不同，BFS 的层序最短性会失效。

## Dijkstra：非负权重下的引力井

Dijkstra 适合非负边权。优先队列每次弹出的都是当前未确定节点中距离最小者，因此可以安全定型。

```cpp
using P = pair<long long, int>;
priority_queue<P, vector<P>, greater<P>> pq;
vector<long long> dist(n, INF);
dist[s] = 0;
pq.push({0, s});

while (!pq.empty()) {
    auto [du, u] = pq.top();
    pq.pop();
    if (du != dist[u]) continue;
    for (auto [v, w] : g[u]) {
        if (dist[v] > du + w) {
            dist[v] = du + w;
            pq.push({dist[v], v});
        }
    }
}
```

## 常见误判

| 现象 | 可能原因 | 修正 |
| --- | --- | --- |
| BFS 答案偏小 | 状态维度丢失 | 把钥匙、方向、资源加入状态 |
| Dijkstra 超时 | 重复入队过多 | 使用 `if (du != dist[u]) continue` |
| 最短路为负 | 存在负权边 | 改用 Bellman-Ford / SPFA / Johnson |
| 路径恢复错误 | 只存距离未存前驱 | 松弛时记录 `parent[v] = u` |

真正的图论训练，是把题面翻译成状态空间的能力。模板只是望远镜，建模才是星图。