# 인덱스(Index) 최적화 보고서 - 최적화 진행

## 1. 인덱스가 필요한 쿼리

- 현재 시나리오에서 수행되는 쿼리 중에, join 이 여러번 되는 복잡한 쿼리는 없다고 판단했습니다.
- 따라서, 자주 조회될 것 같은 쿼리들에 인덱스를 적용하기로 결정했습니다.
- 검토 결과, Concert, PerformanceDate, Seat 테이블에 인덱스를 적용하였습니다.

## 2 테이블 선정 이유

- 콘서트 예매 서비스에서 사용자들이 가장 빈번하게 조회할 것 같은 정보가 무엇인가 생각했을 때, **콘서트 목록 조회**, **공연 날짜 조회**, **좌석 조회** 를 가장 많이 사용할 것이라 판단하였습니다.

## 3 Concert 테이블

- **name** 에 인덱스 적용

### 3.1 인덱스 적용 이유

#### Table "concert"

| Column   | Type      | Collation | Nullable | Default                             |
| -------- | --------- | --------- | -------- | ----------------------------------- |
| id       | integer   |           | not null | nextval('concert_id_seq'::regclass) |
| name     | character |           | not null |                                     |
| location | character |           | not null |                                     |

name: unique \
location: 100개 종류 중복 \
총 데이터 수: 100,000 건

- 조회 가능한 경우의 수를 볼 때, 전체 조회, 특정 콘서트 명에 대해서 조회, 특정 위치에 대해서 조회. 3가지로 나눠집니다.
- location 의 카디널리티: 100
- name 의 카디널리티: 100,000
  -> 특정 위치에 대한 조회 성능을 위해 location 에 인덱스를 적용한다 하더라도 유의미한 효과는 없다고 사료되어 **name 에만 인덱스 적용**

### 3.2 성능 비교

- 인덱싱을 사용했을 때, 쿼리 성능을 비교하기 위한 것이므로 k6 보다는 **EXPLAIN ANALYZE** 로 SQL 쿼리가 실행되는 실제 계획 및 소요 시간을 측정하는 것이 더 효율적일 것이라 판단하여 EXPLAIN ANALYZE로 성능을 비교하였습니다.

#### CASE 1 인덱스 적용 전 특정 Concert 정보 조회 (소요 시간: 8.437ms, 11.112ms)

```sql
concert=# EXPLAIN ANALYZE SELECT * FROM concert where name = 'Concert 23342';
QUERY PLAN
Seq Scan on concert (cost=0.00.1986.00 rows=1 width=28) (actual time=1.916..8.415 rows=1 loops=1)
Filter: ((name):: text = 'Concert 23342':: text)
Rows Removed by Filter: 99999
Planning Time: 0.072 ms
Execution Time: 8.437 ms
```

```sql
concert=# EXPLAIN ANALYZE SELECT * FROM concert where name = 'Concert 63342' ;
QUERY PLAN
-==-
Seq Scan on concert (cost=0.00.1986.00 rows=1 width=28) (actual time=9.419..11.093 ows=1 loops=1)
Filter: ((name):: text = 'Concert 63342':: text)
Rows Removed by Filter: 99999
Planning Time: 0.096 ms
Execution Time: 11.112 ms
```

- 평균적으로 약 **10ms** 소요

#### CASE 2 인덱스 적용 후 특정 Concert 정보 조회 (소요 시간: 0.084ms, 0.063ms)

```sql
QUERY PLAN
Index Cond: ((name):: text = 'Concert 63342' : : text)
Planning Time: 0.240 ms
Execution Time: 0.084 ms
```

```sql
QUERY PLAN
Index Scan using idx_concert_name on concert (cost=0.42..8.44 rows=1 width=28) (actual time=0.041..0.042 rows=1 loops=1)
Index Cond: ((name):: text = 'Concert 63342' :: text)
Planning Time: 0.096 ms
Execution Time: 0.063 ms
```

- 평균적으로 약 **0.073ms** 소요

## 4 PerformanceDate 테이블

- **performanceDate** 에 인덱스 적용

### 4.1 인덱스 적용 이유

#### Table "performanceDate"

| Column          | Type      | Collation | Nullable | Default                                      |
| --------------- | --------- | --------- | -------- | -------------------------------------------- |
| id              | integer   |           | not null | nextval('performance_date_id_seq'::regclass) |
| concertId       | integer   |           | not null |                                              |
| performanceDate | timestamp |           | not null |                                              |

총 데이터 수: 3097210건 \
concertId 카디널리티: 99910 \
performanceDate 카디널리티: 51250

- 일반적으로 특정 콘서트에 대한 공연 날짜를 조회하는 경우가 많다고 생각하여 **concertId 에만 단일 인덱스를 적용**하였습니다.

### 4.2 성능 비교

#### CASE 1 인덱스 적용 전 특정 Concert 에 대한 공연 날짜 조회 (소요 시간: 69.565ms, 73.377ms)

```sql
QUERY PLAN
Gather (cost=1000.00..33876.40 rows=31 width=16) (actual time=55.641..69.498 rows=31 loops=1)|
Workers Planned: 2
Workers Launched: 2
-> Parallel Seq Scan on performance_date (cost=0.00..32873.30 rows=13 width=16) (actual time=47.275.. 50.559 rows=10 loops=3)
Filter: ("concertId" = 75120)
Rows Removed by Filter: 1032393
Planning Time: 0.160 ms
Execution Time: 69.565 ms
```

```sql
QUERY PLAN
Gather (cost=1000.00..33876.40 rows=31 width=16) (actual time=70.525..73.321 rows=31 loops=1)
Workers Planned: 2
Workers Launched: 2
-> Parallel Seq Scan on performance_date (cost=0.00.32873.30 rows=13 width=16) (actual time=48.954.50.565 rows=10 loops=3)
Filter: ("concertId" = 87520)
Rows Removed by Filter: 1032393
Planning Time: 0.291 ms
Execution Time: 73.377 ms
```

- 평균적으로 약 **71ms** 소요

#### CASE 2 인덱스 적용 후 특정 Concert 에 대한 공연 날짜 조회 (소요 시간: 0.062ms, 0.170ms)

```sql
QUERY PLAN
Index Scan using idx_concert_id on performance_date (cost=0.43..8.97 rows=31 width=16) (actual time=0.030..0.039 rows=31 loops=1)|
Index Cond: ("concertid" = 75120)
Planning Time: 0.101 ms
Execution Time: 0.062 ms
```

```sql
QUERY PLAN
Index Cond: ("concertId" = 87520)
Planning Time: 0.320 ms
Execution Time: 0.170 ms
```

- 평균적으로 약 **0.116ms** 소요

## 5. Seat 테이블

- **concertId 와 performanceDate**에 복합 인덱스 적용

### 5.1 인덱스 적용 이유

#### Table "seat"

| Column          | Type              | Collation | Nullable | Default                          |
| --------------- | ----------------- | --------- | -------- | -------------------------------- |
| id              | integer           |           | not null | nextval('seat_id_seq'::regclass) |
| concertId       | integer           |           | not null |                                  |
| seatNumber      | integer           |           | not null |                                  |
| performanceDate | timestamp         |           | not null |                                  |
| status          | character varying |           | not null |                                  |
| releaseAt       | timestamp         |           |          |                                  |
| price           | numeric           |           | not null |                                  |

총 데이터 수: 9699900건 \
concertId 카디널리티: 15645 \
performanceDate 카디널리티: 149609

- 특정 날짜에 대한 특정 콘서트의 좌석 정보를 조회하는 쿼리가 많이 실행될 거라고 생각하여 **concertId 와 performanceDate에 복합 인덱스를 적용**하였습니다.
- status 에 대한 좌석 조회도 인덱스 적용이 필요할까 고민해보았지만 status 는 업데이트도 빈번히 일어날 것 같아서 적용하지 않았습니다.
- 단일 인덱스만을 적용했을 때 속도가 얼마나 차이나는지 궁금하여 테스트 케이스에 추가하여 작업하였습니다.
- 복합인덱스와 단일 인덱스를 2개 설정하는 것의 차이를 확인하고 싶어 테스트 케이스에 추가하여 작업하였습니다.

### 5.2 성능 비교

#### CASE 1 인덱스 적용 전 특정 날짜 및 Concert 에 대한 공연 날짜 조회 (소요 시간: 289.676ms)

```sql
QUERY PLAN
Gather (cost=1000.00..152590.32 rows=21 width=43) (actual time=93.817..289.321 rows=20 loops=1)
Workers Planned: 2
Workers Launched: 2
-> Parallel Seq Scan on seat (cost=0.00..151588.22 rows=9 width=43) (actual time=179.351..242.606 rows=7 loops=3)
Filter: (("performanceDate" >= '2024-11-21 00:00:00':: timestamp without time zone) AND ("performanceDate" <= '2024-11-21 23:59:59':: timestamp without time zone) AND ("concertId" = 2500))
Rows Removed by Filter: 3233293
Planning Time: 0.287 ms
Functions: 6
Options: Inlining false, Optimization false, Expressions true, Deforming true
Timing: Generation 1.247 ms (Deform 0.274 ms), Inlining 0.000 ms, Optimization 0.887 ms, Emission 11.043 ms, Total 13.176 ms
Execution Time: 289.676 ms
```

- 소요 시간: **289.676ms**

#### CASE 2 concertId 단일 인덱스 적용 후 특정 날짜 및 Concert 에 대한 공연 날짜 조회 (소요 시간: 0.136ms)

```sql
QUERY PLAN
Index Scan using "IDX_570eb4227f33ce79013c871bd" on seat (cost=0.43..29.50 rows=21 width=43) (actual time=0.054..0.115 rows=20 loops=1)
Index Cond: ("concertId" = 2500)
Filter: (("performanceDate" >= '2024-11-21 00:00:00':: timestamp without time zone) AND ("performanceDate" <= '2024-11-21 23:59:59':: timestamp without time zone))
Rows Removed by Filter: 600
Planning Time: 0.107 ms
Execution Time: 0.136 ms
```

- 소요 시간: **0.136ms**

#### CASE 3 performanceDate 단일 인덱스 적용 후 특정 날짜 및 Concert 에 대한 공연 날짜 조회 (소요 시간: 46.489ms)

```sql
QUERY PLAN
Gather (cost=4911.08..128698.09 rows=21 width=43) (actual time=26.275..46.125 rows=20 loops=1)
Workers Planned: 2
Workers Launched: 2
-> Parallel Bitmap Heap Scan on seat (cost=3911.08..127695.99 rows=9 width=43) (actual time=19.535..24.261 rows=7 loops=3)|
Recheck Cond: (("performanceDate" >= '2024-11-21 00:00:00':: timestamp without time zone) AND ("performanceDate" <= '2024-11-21 23:59:59':: timestamp without time zone))
Filter: ("concertId" = 2500)
Rows Removed by Filter: 104293
Heap Blocks: exact=7735
-> Bitmap Index Scan on idx_performance_date (cost=0.00..3911.07 rows=291064 width=0) (actual time=13.942..13.942 rows=312900 loops=1)
Index Cond: (("performanceDate" >= '2024-11-21 00:00:00':: timestamp without time zone) AND ("performanceDate" <= '2024-11-21 23:59:59':: timestamp without time zone))
Planning Time: 0.107 ms
JIT:
Functions: 12
Options: Inlining false, Optimization false, Expressions true, Deforming true
Timing: Generation 0.937 ms (Deform 0.255 ms), Inlining 0.000 ms, Optimization 0.546 ms, Emission 7.802 ms, Total 9.285 ms
Execution Time: 46.489 ms
```

- 소요 시간: **46.489ms**

#### CASE 5 concertId, performanceDate 각각 단일 인덱스 적용 후 특정 날짜 및 Concert 에 대한 공연 날짜 조회 (소요 시간: 0.198ms)

```sql
QUERY PLAN
Index Scan using idx_concert_id on seat (cost=0.43..29.50 rows=21 width=43) (actual time=0.089..0.181 rows=20 loops=1)
Index Cond: ("concertId" = 2500)
Filter: (("performanceDate" >= '2024-11-21 00:00:00':: timestamp without time zone) AND ("performanceDate" <= '2024-11-21 23:59:59':: timestamp without time zone))
Rows Removed by Filter: 600
Planning Time: 0.254 ms
Execution Time: 0.198 ms
```

- 소요 시간: **0.198ms**

#### CASE 4 concertId, performanceDate 복합 인덱스 적용 후 특정 날짜 및 Concert 에 대한 공연 날짜 조회 (소요 시간: 0.043ms)

```sql
QUERY PLAN
Index Scan using idx_seat_concert_id_performance_date on seat
(cost=0.43..43.91 ows=21 width=43) (actual time=0.025..0.028 rows=20 loops=1)
Index Cond: (("concertId" = 2500) AND ("performanceDate" >= '2024-11-21 00:00:00':: timestamp without time zone) AND ("performanceDate" <= '2024-11-21 23:59:59':: timestamp without time zone))
Planning Time: 0.087 ms
Execution Time: 0.043 ms
```

- 소요 시간: **0.043ms**
