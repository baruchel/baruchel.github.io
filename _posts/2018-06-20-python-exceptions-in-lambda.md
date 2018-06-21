---
layout: post
title:  "Playing with exceptions inside lambda expressions in Python"
date:   2018-06-20
categories: python
---
The following piece of code can certainly claim being **the most insane Python expression ever written**:

~~~python
C = lambda f: (
      lambda *args: (
        lambda o: (
          lambda g: { None } | {
              None for _ in iter(lambda:
               (lambda G: (not G) or o.append(G.pop()))
               (list((lambda:
                   (yield from (g(*o.pop()) for _ in (None,))))())), None)
          } and o.pop())(f(lambda *a: o.append(a) or next(iter(())))))([args]))
~~~

The two most notable hidden features of this expressions are a true infinite loop and a rudimentary `try/except/raise` system.

Since the [PEP 463](https://www.python.org/dev/peps/pep-0463/) was rejected, there is no general way of catching an exception in an expression (raising any exception is very easy on the other hand). I fall upon a [question about it](https://stackoverflow.com/questions/45803245/how-to-catch-exceptions-using-python-lambdas) and answered it by explaining all my ideas about what could actually be achieved.

Then I decided to implement a trampoline-based system allowing user-defined functions to jump back to the initial continuation by using the very single exception I finally managed to fully handle in an expression, which is `StopIteration`.

Implementing an infinite loop is very easy:

~~~python
{ None for _ in iter(f, None) }
~~~

with a relevant `f` function will run as long as expected without needing any memory since the size of the set will not increase during the computation.

Raising the `StopIteration` exception can be achieved either with a general solution or with a _ad hoc_ expression:

~~~python
(_ for _ in ()).throw(StopIteration)

next(iter(()))
~~~

Catching the exception can be achieved by computing everything inside an iterator intended to run over a single value: once converted to a list, the sequence will either be empty or contain one returned value. The following piece of code randomly returns `[]` or `[1]` (if an exception is raised or not):


~~~python
from random import randrange

list((lambda:(yield from (randrange(0,2) or next(iter(())) for _ in (None,))))())
~~~


Here is a tail-recursive version of the factorial using the `C` expression defined above:

~~~python
myfac = C(lambda f: lambda n, acc: f(n-1, n*acc) if n else acc)

print("Factorial of 0 is", myfac(0, 1))
print("Factorial of 1 is", myfac(1, 1))
print("Factorial of 5 is", myfac(5, 1))
print("Factorial of 6 is", myfac(6, 1))
~~~

Here is another function showing how the callback function allows to escape an infinite loop: the call to `g(1)` obviously makes the evaluation entering the inner loop, but the `DEBUG` word is actually not printed because evaluating `f(0)` makes the evaluation return back to the initial continuation:

~~~python
def outer(f):
    def inner(n):
        if n == 0: return 42
        while True:
            print("DEBUG", f(0))
    return inner
g = C(outer)
print(g(1))
~~~

The `C` expression should be strong enough to be used with any user-defined function as long as it doesn't use the callback function inside an iterator being wrapped in a `yield from` expression, which is not likely to happen.
