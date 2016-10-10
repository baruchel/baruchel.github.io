---
layout: post
title:  "Continuations in Python"
date:   2016-10-10
categories: python
---
In previous posts, I already wrote about continuations in Python. Below are some new ideas on the topic. First of all, I released yesterday a new version (v. 1.2.1) of the [tco](https://github.com/baruchel/tco) module, with a decorator. Thinking again to it lead me to write a new module from scratch, by keeping a similar internal mechanism but behaving quite differently. My new module id [continuation](https://github.com/baruchel/continuation).

While the _tco_ module requires the coder to use a rather heavy syntax, I wanted to achieve a more mature project, easier to use. Here is a tail-recursive code for the factorial function:

~~~python
@with_continuation
def k_factorial(k):
    def _inner(n, f):
        return f if n < 2 else (k << k_factorial)(n-1, n*f)
    return _inner

factorial = lambda n: (with_CC >> k_factorial)(n, 1)
~~~

Every feature of the module can be seen in this piece of code:

  * a decorator is provided for defining the functions to be used with the module;
  * the syntax `(with_CC >> k_func)(*args)` is used for passing the current continuation to a function before calling it with its arguments;
  * the syntax `(k << k_func)(*args)` is used for calling a function with some arguments after having returned back in the stack to the level of the initial call.

A first difference with the _tco_ module is that decorated functions now take a single argument (a continuation), making the syntax simpler and more consistent. On the other hand, achieving tail-recursion may seem a little more complicated at first glance. Another significant difference is the “visual” notation for playing with the continuation, which should make the process easier to understand: the two operators `>>` and `<<` are intended to look like arrows pointing toward a meaningful left or right direction.

Importing the module is done with:

~~~python
from continuation import with_CC, with_continuation
~~~

The following code shows that nested calls are correctly handled; while trapped inside three levels of `while True` loops, the single `return` statement in the `k_identity` function make the most external call return immediately:

~~~python
@with_continuation
def k_test1(k):
    def _inner(v):
        while True: (with_CC >> k_test2)(k, v)
    return _inner

@with_continuation
def k_test2(k):
    def _inner(cont, v):
        while True: (with_CC >> k_test3)(cont, v)
    return _inner

@with_continuation
def k_test2(k):
    def _inner(cont, v):
        while True: (cont << k_identity)(v)
    return _inner

@with_continuation
def k_identity(k):
    def _inner(x):
        return x
    return _inner

print ((with_CC >> k_test1)(42))
~~~
