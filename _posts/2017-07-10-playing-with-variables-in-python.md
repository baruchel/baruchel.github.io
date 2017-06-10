---
layout: post
title:  "Playing with variables in Python"
date:   2017-07-10
categories: python
---
Trying again to hack the Python language itself, I will publish in this post two little pieces of code for tweaking the scope of global variables.

The first one is a _decorator_ "freezing" some global variables to their current value at the time a function is defined.

~~~python
def protect(*A):
    def D(f):
        protected = {}
        for k in A: protected[k] = globals()[k]
        def wrapper(*args, **kwargs):
            previous = {}
            g = globals()
            for k in A:
                if k in g: previous[k] = g[k]
            for k in A: g[k] = protected[k]
            try:
                out = f(*args, **kwargs)
            except Exception:
                for k in A:
                    if k in previous: g[k] = previous[k]
                    else: del g[k]
                raise
            for k in A:
                if k in previous: g[k] = previous[k]
                else: del g[k]
            return out
        return wrapper
    return D
~~~

Let's try it:

~~~python
a = 42

@protect("a")
def test(n):
    return a*n

print(test(15))
a=5
print(test(15))
~~~

should print twice the value 630 despite the fact the global variable `a` has been redefined in the meantime.

The second piece of code is a context manager mimicking the behaviour of the `let` function in Lisp-like languages:

~~~python
class RestrictedScope():
    def __init__(self, scope):
        self.scope = scope
    def __enter__(self):
        self.p = {}
        g = globals()
        for k in self.scope:
            if k in g: self.p[k] = g[k]
            g[k] = self.scope[k]
    def __exit__(self, *a):
        g = globals()
        for k in self.scope:
            if k in self.p: g[k] = self.p[k]
            else: del g[k]
~~~

This context manager temporarily hides global variables, restoring them to their current state as soon as the context is left:

~~~python
a = 42
def test(n):
    return a*n

print(test(10))
with RestrictedScope({"a": 10}):
    print(test(10))
print(test(10))
~~~
