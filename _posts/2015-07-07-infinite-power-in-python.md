---
layout: post
title:  "Infinite power in Python"
date:   2015-07-07
categories: python
---
A nice feature in the J programming language is the infinite power operator, which gives the ability to raise a function to the infinite power. The idea is to repeatedly apply a function to its previous result until some convergence is reached or until some system is stabilized. Such a feature allows to "hide" many `while` loops.

Here is a link to the page of the *J for C programmers* book explaining more about this way of coding: [Loopless Code IV](http://www.jsoftware.com/help/jforc/loopless_code_iv_irregular_o.htm).

Implementing such a feature in Python is rather easy:

~~~python
class __infinitepower__():
    def __init__(self):
        pass
    def __rpow__(self,f):
        def func(a):
            while True:
                b = f(a)
                if b == a:
                    return b
                a = b
        return func
infinitepower = __infinitepower__()
infinitepower.__rxor__ = infinitepower.__rpow__
~~~

This piece of code creates the `infinitepower` variable which can be used for raising any function to the infinite power. This object may be affected to a new variable with a shorter name for convenience purposes (rename it to `oo`, `Inf`, or any other name).

    >>> oo=infinitepower
    >>> from math import sqrt, cos
    >>> (cos**oo)(.5)
    0.7390851332151607
    >>> (sqrt^oo)(.5)
    0.9999999999999999

Of course, the operator for "power" is `**` in Python, but it isn't much more coding to also allow the variable to be used with `^` (while it could be held as a very bad idea from a pythonic point of view).
