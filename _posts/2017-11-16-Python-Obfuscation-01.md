---
layout: post
title:  "Python Obfuscation #1"
date:   2017-11-16
categories: python
---

As usually I am going here to cheat with Python good practices in order to have fun. As is said at the beginning of a [funny piece of code](https://gist.github.com/brool/1679908): _If you use this for anything important, you're mad!_ Still, I will polish everything below and try to provide functions on par with the best written ones in regards to speed and memory usage.

My general rules in such challenges are the following ones:

  * avoid statements;
  * avoid importing any module;
  * obviously avoid `exec` or `eval`;
  * avoid `def` or `class` for defining anything.

Such requirements come from a strong functionnal programming background though I am aware they don't fit well with Python standards.

## The task

I want to write a `loop` function; since it has to be a single expression that could easily be embedded in a larger expression, I will rather say I want to write a `loop` macro. It should be able to iterate infinitely if required with no stack or heap overflow.

The usage of the macro is intended to be:

~~~python
result = loop(func, cond, x0)
~~~

where `func` is a function repeatedly applied to `x0` then `x1=f(x0)` then `x2=f(x1)`, etc., `cond` a function applied (before `func`) to the current temporary result before iterating and returning `True` as long as iteration has to go on, and `x0` is the initial value. The macro should return the last computed value, which is the first such that `cond(result)` is `False`.

## Iterating

There are several ways for iterating inside an expression. It is well known that lambda calculus allows iterating with the famous [Y combinator](https://en.wikipedia.org/wiki/Fixed-point_combinator), but it will not allow to iterate infinitely because of the maximum recursion depth.

The most common iterating process in an expression (in Python) is performed with the [list comprehension syntax](https://docs.python.org/2/tutorial/datastructures.html#list-comprehensions). A funny way of using it is to iterate over a list being modified in order to get some control on the number of iterations _from the inside_ of the list comprehension; see the example below for computing consecutive terms in the Collatz sequence:

~~~python
collatz = lambda n: (lambda c:
               [k > 1 and c.append((k%2 and 3*k+1) or k//2) for k in c]
             and c)([n])
~~~

It is assumed here that the reader is familiar with the exact meaning of `and` and `or` in Python (what is evaluated or not and what is exactly yielded).

But appending new terms to a list will of course lead soon to a _MemoryError_ when too many iterations are performed.

The same idea can however be tweaked in order to avoid any memory usage; if `G` is some iterator running as long as needed, then:

~~~python
[ None for x in G if <expr> and None ]
~~~

will not append any term to the current list; of course, if `<expr>` is known to return something like `None`, the final part can be removed; if `<expr>` is known to return something like `True`, another simplification would be:

~~~python
[ None for x in G if not <expr> ]
~~~

and if `<expr>` is known to return _always_ the same value (like `None`), then a very nice simplification is:

~~~python
{ <expr> for x in G }
~~~

because a set doesn't keep duplicates!

## Creating a class from within an expression

Of course anything like `range(2**65536)` _does not run infinitely_ though no actual task should require such a large amount of iterations. On the other hand, I couldn't figure out any infinite iterator without importing such or such module, which I want to avoid.

Creating a new iterator implies defining a new class, which is achievable in an expression:

~~~python
type("MyClass", (object,), {})
~~~

yielding a kind of empty class. New methods can be added to it with:

~~~python
Evil = (
          lambda o:
               setattr(o, '__iter__', lambda x:x)
               or setattr(o, '__next__', lambda x:True)
               or o
       )(type("EvilIterator", (object,), {}))
~~~

Of course an instance can be returned by adding `()` at the end of the whole expression or after the `or o` part.

It can be checked that this macro looks like what I want by typing:

~~~python
{ print("Hello world") for _ in Evil() }
~~~

## The final part

Now comes the final part; the `Evil` iterator above has to be tuned according to our needs.

Since the loop has to end when some condition is encountered, the iterator should raise a _StopIteration_ exception, which can be achieved either by evaluating some expression doing the same thing like `next(_ for _ in ())` or by using the `throw` method on any available generator allowing to throw any kind of exception: `(_ for _ in ()).throw(StopIteration)`.

A first attempt is:

~~~python
loop = lambda f, t, i: (
          lambda o, w:
               setattr(o, '__iter__', lambda x:x)
               or setattr(o, '__next__', lambda x:
                     (t(w[-1]) and not w.append(f(w.pop())))
                         or next(_ for _ in ()))
               or o
       )(type("EvilIterator", (object,), {}), [i])()
~~~

tested with:

~~~python
[x for x in loop(lambda x: x-1, lambda x: x>0, 5)]
~~~

which yields the expected `[True, True, True, True, True]`. Using a set rather than a list help controlling the size of the set but since we want to return the last computed value, we have to do it inside. As a cosmetic change, the line containing the `append` part can also be turned to

~~~python
(t(w[0]) and not w.__setitem__(0, f(w[0])))
~~~

which may be slightly faster.

The final version finally is:

~~~python
loop = lambda f, t, i: (
          lambda o, w:
               setattr(o, '__iter__', lambda x:x)
               or setattr(o, '__next__', lambda x:
                     (t(w[0]) and not w.__setitem__(0, f(w[0])))
                         or next(_ for _ in ()))
               or { _ for _ in o() }
               and w[0]
       )(type("EvilIterator", (object,), {}), [i])
~~~

tested with: `loop(lambda x: x-1, lambda x:x > 0, 5)`. Of course a list can be used instead of a set as long as a filter helps controlling the size of the list:

~~~python
               or [ x for x in o() if not x ]
               or w[0]
~~~

Now we can try to find some factor of an integer number by using the brute force:

~~~python
loop(lambda x: x+1, lambda x: 8927%x, 2)
~~~
