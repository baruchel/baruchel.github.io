---
layout: post
title:  "Self Reference in Python"
date:   2015-07-16
categories: python
---

The J language has a verb called "Self Reference" which is `$:` allowing a recursive call to the "longest verb that contains it" (see [J dictionary](http://www.jsoftware.com/help/dictionary/d212.htm)).

Here is a way for implementing a similar feature in Python. I made it work on several versions of Python (versions 2 and 3 with CPython as well as with Pypy).

~~~python
import sys
class _self_reference():
    def __call__(self, *args):
        f = lambda *a: None
        f.__code__ = sys._getframe(1).f_code
        return f(*args)
    def __getitem__(self,n):
        def func(*args):
            f = lambda *a: None
            f.__code__ = sys._getframe(n+1).f_code
            return f(*args)
        return func
self = _self_reference()
~~~

Of course the `self` variable can be renamed like `this` or even simply `_`.

The `self` function now calls the function called previously with new arguments. Now, the factorial function is:

~~~python
fac = lambda n: 1 if n <= 1 else n*self(n-1)
~~~

Of course, some care has to be taken concerning the numbers of call levels that a single function may add to the execution stack. If needed, the syntax `self[1](...)` may be used to get to refer to the the function called one more level below, and of course any positive integer will work.

The following example is rather useless but it shows how to jump to the second level by complicating the previous definition of the factorial:

~~~python
fac2 = lambda n: 1 if n <= 1 else n*((lambda k: self[1](k-1))(n))
~~~
