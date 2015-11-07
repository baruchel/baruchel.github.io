---
layout: post
title:  "Optimizing tail-recursion in Python"
date:   2013-12-03
categories: python
---
It has often been claimed that tail-recursion doesn't suit the pythonic way of coding
and that one shouldn't care about how to embed it in a loop. I don't want to argue with
this point of view; sometimes however I like trying or implementing new ideas
as tail-recursive functions rather than with loops for various reasons (focusing on the
idea rather than on the process, having twenty short functions on my screen in the same
time rather than only three "pythonic" functions, working in an interactive session rather
than editing my code, etc.).

Optimizing tail-recursion in Python is in fact quite easy. While it is said to be impossible
or very tricky, I think it can be achieved with elegant, short and general solutions; I even
think that most of these solutions don't use Python features otherwise than they should.
Clean lambda expressions working along with very standard loops lead to quick, efficient and
fully usable tools for implementing tail-recursion optimization.

As a personal convenience, I wrote a small module implementing such an optimization
by two different ways. I would like to discuss here about my two main functions.

### The clean way: modifying the Y combinator

The Y combinator is well known; it allows to use lambda functions in a recursive
manner, but it doesn't allow by itself to embed recursive calls in a loop. Lambda
calculus alone can't do such a thing. A slight change in the Y combinator however
can protect the recursive call to be actually evaluated. Evaluation can thus be delayed.

Here is the famous expression for the Y combinator:

~~~python
lambda f: (lambda x: x(x))(lambda y: f(lambda *args: y(y)(*args)))
~~~

With a very slight change, I could get:

~~~python
lambda f: (lambda x: x(x))(lambda y: f(lambda *args: lambda: y(y)(*args)))
~~~

Instead of calling itself, the function f now returns a function performing the
very same call, but since it returns it, the evaluation can be done later from outside.

My code is:

~~~python
def B(func):
    b = (lambda f: (lambda x: x(x))(lambda y:
          f(lambda *args: lambda: y(y)(*args))))(func)
    def wrapper(*args):
        out = b(*args)
        while callable(out):
            out = out()
        return out
    return wrapper
~~~
 
The function can be used in the following way; here are two examples with tail-recursive
versions of factorial and Fibonacci:

    >>> from recursion import *
    >>> fac = B( lambda f: lambda n, a: a if not n else f(n-1,a*n) )
    >>> fac(5,1)
    120
    >>> fibo = B( lambda f: lambda n,p,q: p if not n else f(n-1,q,p+q) )
    >>> fibo(10,0,1)
    55

Obviously recursion depth isn't an issue any longer:

    >>> B( lambda f: lambda n: 42 if not n else f(n-1) )(50000)
    42

This is of course the single real purpose of the function.
    
Only one thing can't be done with this optimization: it can't be used with a
tail-recursive function evaluating to another function (this comes from the fact
that callable returned objects are all handled as further recursive calls with
no distinction). Since I usually don't need such a feature, I am very happy
with the code above. However, in order to provide a more general module, I thought
a little more in order to find some workaround for this issue (see next section).

Concerning the speed of this process (which isn't the real issue however), it happens
to be quite good; tail-recursive functions are even evaluated much quicker than with
the following code using simpler expressions:

~~~python
def B0(func):
    def wrapper(*args):
        out = func(lambda *x: lambda: x)(*args)
        while callable(out):
            out = func(lambda *x: lambda: x)(*out())
        return out
    return wrapper
~~~

I think that evaluating one expression, even complicated, is much quicker than
evaluating several simple expressions, which is the case in this second version.
I didn't keep this new function in my module, and I see no circumstances where it
could be used rather than the "official" one.


### Continuation passing style with exceptions

Here is a more general function; it is able to handle all tail-recursive functions,
including those returning other functions. Recursive calls are recognized from
other return values by the use of exceptions. This solutions is slower than the
previous one; a quicker code could probably be written by using some special
values as "flags" being detected in the main loop, but I don't like the idea of
using special values or internal keywords. There is some funny interpretation
of using exceptions: if Python doesn't like tail-recursive calls, an exception
should be raised when a tail-recursive call does occur, and the pythonic way will be
to catch the exception in order to find some clean solution, which is actually what
happens here...

~~~python
class _RecursiveCall(Exception):
    def __init__(self, *args):
        self.args = args
def _recursiveCallback(*args):
    raise _RecursiveCall(*args)
def B2(func):
    def wrapper(*args):
        while True:
            try:
                return func(_recursiveCallback)(*args)
            except _RecursiveCall as e:
                args = e.args
    return wrapper
~~~
    
Now all functions can be used. In the following example, `f(n)` is evaluated to the
identity function for any positive value of n:

    >>> f = B2( lambda f: lambda n: (lambda x: x) if not n else f(n-1) )
    >>> f(5)(42)
    42

Of course it could be argued that exceptions are not intended to be used for intentionnaly
redirecting the interpreter (as a kind of `goto` statement or probably rather a kind of
continuation passing style), which I have to admit. But, again,
I find funny the idea of using `try` with a single line being a `return` statement: we try to return
something (normal behaviour) but we can't do it because of a recursive call occuring (exception).
