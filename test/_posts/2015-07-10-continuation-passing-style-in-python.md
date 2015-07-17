---
layout: post
title:  "Continuation passing style in Python"
date:   2015-07-10
categories: python
---
Here are some thoughts concerning the continuation passing style in Python. Of course, being able to take any function as an argument for another function, the language already allows to use such a style of programming when needed; but this artcle focus on some elegant ways of calling a function from the innermost part of an expression without burdening the call stack of the interpreter. Like in a previous article, tail-call optimization is the purpose of this study.

### First part: the main idea

First, let's create a function diplaying together its argument and the current size of the stack; it will be used below in order to check where exactly a call to a continuation is made:

~~~python
import traceback

def disp(x):
    print((len(traceback.extract_stack()),x))
~~~

Now, let's figure out some function performing some kind of computation, adding many calls to the execution stack, and finally calling a continuation. A recursive function will suit these needs:

~~~python
def test(k,n):
    return test(k,n-1) if n>0 else k(42)
~~~

While useless, this function is easy to understand: it calls itself many times  with a decreasing counter then calls the function `k` with an argument being 42.

Now, lets's see what happens:

    >>> test(disp, 100)
    (103, 42)

(The exact left value may change with the interpreter but it should be a little more than 100.)

An elegant way of getting rid of these useless calls waiting to return is to embed the initial call to the `test` function in some wrapper like:

~~~python
C = lambda f: lambda c, *a: f(lambda x: lambda : c(x), *a)()
~~~

Let's check:

    >>> C(test)(disp, 100)
    (4, 42)

The idea is to trap the argument intended to be given to the `disp` function in a closure, to return and empty the execution stack, and then to call the continuation.

The previous syntax allows a single return value which is the continuation; thus the following function can't work properly:

~~~python
def test2(k,n,b):
    return test2(k,n-1,not b) if n>0 else k(42) if b else None
~~~

Below is a working example and a faulty one:

    >>> C(test2)(disp, 100, True)
    (4, 42)
    >>> C(test2)(disp, 100, False)
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
      File "<stdin>", line 1, in <lambda>
    TypeError: 'NoneType' object is not callable

Some workaround can be found with:

~~~python
C2 = ( lambda f: lambda c, *a:
       (lambda g: g() if callable(g) else g)
       (f(lambda x: lambda : c(x), *a) ) )
~~~

But the following part of the article will focus on the initial case where the single allowed return value is the call to the continuation.

### Second part: variants of the previous solution

The above solution requires the user to put the continuation argument `k` as the first one of the function while many programmers usually put it after all other arguments. This order can be implemented but is less elegant than the previous one:

~~~python
C3 = lambda f: lambda *a: f(*(list(a[:-1]) + [lambda x: lambda : a[-1](x)]) )()
~~~

I personally like another way for the very same idea (I also use the Y combinator for implementing the recursion in order to only rely here on lambda calculus):

~~~python
Y = lambda f: (lambda x: x(x))(lambda y: f(lambda *args: y(y)(*args)))
test = lambda k: lambda n: Y(lambda f: lambda i: f(i-1) if i>0 else k(42))(n)
C = lambda f: lambda c: lambda a: f(lambda x: lambda : c(x))(a)()
~~~

which has to be used as:

    >>> C(test)(disp)(100)

This style is itself a good transition to a more general solution allowing several continuations to be used (according to a case which is decided at the top of the stack but with an evaluation occuring once the stack will become empty):

~~~python
C = lambda f: lambda *c: lambda *a: f(*map(lambda k: lambda x: lambda : k(x), c))(*a)()
~~~

which can still be used as:

    >>> C(test)(disp)(100)

but which can also be used as:

~~~python
def disp1(x):
    print(("ok",len(traceback.extract_stack()),x))
def disp2(x):
    print(("err",len(traceback.extract_stack()),x))

test = ( lambda k1, k2: lambda n:
           Y(lambda f: lambda i,j: f(i-1,not j) if i>0
                else k1(42) if j else k2(42))(n,False) )
~~~

where two different continuations are now used. The new wrapper can be used as:

    C(test)(disp1,disp2)(15)

### Third part: two more refinements

Two more improvements will now be added to the wrapper:

  * allowing the continuation to take any number of arguments (usual continuation passing style requires the continuation to take one argument but it won't hurt here to allow more);
  * removing one level more in the execution stack by initially returning a tuple conataining the function and its arguments rather than a function.

The wrapper becomes (in Python 2):

~~~python
C = lambda f: lambda *c: lambda *a: apply(*f(*map(lambda k: lambda *x: (k,x), c))(*a))
~~~

and in Python 3 (where `apply` doesn't exist any more):

~~~python
def C(f):
    def D(*c):
        def E(*a):
            func, args = f(*map(lambda k: lambda *x: (k,x), c))(*a)
            return func(*args)
        return E
    return D
~~~

Now the continuation will be added to the stack only one level above the wrapper itself with no intermediate call.

### The final word

I finally wrote a little module containing various implementations of a general wrapper for handling both tail-elimination: in tail-recursion and in continuation-passing style; it is located at [https://github.com/baruchel/tco](https://github.com/baruchel/tco)
