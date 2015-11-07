---
layout: post
title:  "Explaining functional aspects in python"
date:   2015-11-07
categories: python
---

### Introduction

Many python programmers, who are not aware of really different programming languages sometimes wonder why some coders make such a noise about various functional features allegedly missing in the python language. I want to talk to them in this post and try to explain to them, by using the language they know and like, some of the programming techniques involved in these questions.

First of all, I am not at all saying here or below that something is wrong in Python. As a programmer who spent much time in implementing tail-recursion and continuation-passing-style as modules for the python language, I am not claiming here that such things should be inplemented in the core of the language; I read the position of the author of python [here](http://neopythonic.blogspot.fr/2009/04/tail-recursion-elimination.html) and [here](http://neopythonic.blogspot.com.es/2009/04/final-words-on-tail-calls.html); I understand it and agree with it up to a certain point. Let's face the truth: nobody actually does force me to use python if I don't want to use it. When I need spped, I use C or Fortran; when I want to focus on elegant algorithms, I use Lisp or Scheme; when I want to understand more deeply some problem, I use APL or J. For this reason, I think that python is more or less as it should be: a polyvalent language with many libraries allowing to quickly implement a piece of code and debug it.

But sometimes I miss some of these features and this is why I care about them (as other coders also do). Some Python programmers would ask: _what can't I do with Python that I would do with tail-recursion elimination?_ This question is repeatedly asked; I can even say that I am currently writing this post in order to reply to an old [post](http://stackoverflow.com/questions/890461/explain-to-me-what-the-big-deal-with-tail-call-optimization-is-and-why-python-ne) on Stackoverflow.

To that question, the answer is easy: _there is absolutely nothing that I can do with functional techniques that I can't already do with python._ But this is very certainly an ill-posed question. The great programmer Keneth Iverson always thought that the way you code helps you thinking what to code; if such a claim sounds too strange; if you rather think that you merely want to know what is the algorithm you need for such or such problem and then adapt it to Python, then you probably don't need to read further this post: the fact is that you will not discover here some hidden gem that could make your coding more productive.

### Using the tco module

The [tco](https://github.com/baruchel/tco) module is a powerful module made of only a couple of lines allowing mainly:

  * tail-call optimization
  * optimized tail-recursion
  * continuation-passing style
  * pseudo call-with-current-continuation

Two ideas lie behind these features: repeatedly call functions without having the size of the execution stack increasing and possibly jump back from a place in the execution stack to a previous one _without passing through the intermediate calls and their own waiting `return` statements_.

![Drawing hands by M.C. Escher](https://upload.wikimedia.org/wikipedia/en/b/ba/DrawingHands.jpg)

#### A first example: a binary search tree

Let's assume we have a binary tree; searching some node in it is easely done with recursion. Of course, python can do it already very well and most of the time the default size of the execution stack is enough; but I will show here how to do it with tail-recursion. I will also add one more thing: directly escaping from the deepest call of the recursion to the next function which has to handle the result of the search in some way _without escaping from the recursion by using `return` statements_.

First, let's build some perfect binary tree:

~~~python
from itertools import groupby
from random import sample
nbrlevels = 16                # number of levels in the tree
n = 2**nbrlevels - 1          # number of nodes
t = sample(range(2*n), n)     # values of the nodes
t.sort()
def make_tree(l):
    if len(l)==1: return [l[0], [], []]
    return [l[0], make_tree(l[1:len(l)//2+1]),
                  make_tree(l[len(l)//2+1:])]
tree = make_tree(t)
~~~

You can now use the tco module for writing a function that can both:

  * call itself (recursion) without overloading the stack
  * call another function from the inside of the recursion without having to previously exit from the recursion


~~~python
from tco import C

def do_something(node):
    # an arbitrary function for simulating some manipulations
    print "The node",node[0],"is in the tree."

# exit function
exit_success = C(lambda self: do_something)()
exit_failure = C(lambda self: lambda : None)()

# search function
search = C(lambda self, k1, k2: lambda node, n:
       k1(node)
    if n==node[0]
       else ( # not the current node
                 ( # children do exist
                      self(node[1],n) # search left
                   if n < node[2][0]
                      else self(node[2],n) ) # search right
              if node[1]
                 else k2() # no child exists
            ))(exit_success, exit_failure)
~~~

Of course you could object that nobody would write such a code (though it can be very handy for smaller functions); if you like it rather you can rather write:

~~~python
from tco import C

def search(self, k1, k2):
  def code(node, n): 
    if n == node[0]: k1(node)
    elif node[1]:
      if n < node[2][0]: self(node[1],n)
      else: self(node[2],n)
    else: k2()
  return code
search = C(search)(exit_success, exit_failure)
~~~

which will work equally; notice that using the `return` statement is useless in the body of the `code` part (you can use it if you want but you don't have to use it).

You can now use the function with something like `search(tree,42)` in order to search for the value 42 in the tree; the `do_something` function doesn't do anything interesting here except printing a message, but the important thing is that this function will be directly executed outside of the recursion despite appearances.

Now, how does it work? The important things are the parameters: `self`, `k1` and `k2`. Only the first one is required (you can call it with another name if you wish); you can put as many as you want. The letter `k` is a current name in the theory of continuations but you can also choose more explicit names than `k1` or `k2`. These three parameters allow the function inside to call either itself or any other function as the _continuation_ of the whole `search` function.

Except the first parameter (here `self`), all these parameters are associated to functions to be called later with a first call to the function returned by the `C` wrapper; the second version above may lead to an easier understanding if we have a look at the very last line:

~~~python
search = C(search)(exit_success, exit_failure)
~~~

#### A second example: escaping from an infinite loop

Look carefully at the second example below; you will notice a `while True` statement calling a classical python function; how could the program escape from the infinite loop by calling the `untrap` function? The trick is that the very pythonic `untrap` function takes as a parameter the outermost continuation of the `trap` function; thus the infinite loop is started, the `untrap` function is normally called (and added to one more level of the execution stack since it isn't an optimized function), and the `untrap` function calls (from the inside of the loop) a continuation which is _outside_ of the loop. Here the call `trap()` will evaluate to 42.

~~~python
from tco import C

escape = C(lambda f: lambda n: n)() # identity function

def untrap(k):
  k(42)

def trap(self, k1):
  def code():
    while True:
      untrap(k1)
  return code
trap = C(trap)(escape)
~~~

In Van Vogt's novel _The Wizard of Linn_, Clane owns a sphere which is itself the whole universe: Clane is _inside_ the universe but it can as well act upon the universe from _outide of it_. See also the lithograph by M.C. Escher called _Print Gallery_; the standing man is _inside_ the painting on the wall and at the same time _outside_ of it.

![Print gallery by M.C. Escher](https://upload.wikimedia.org/wikipedia/en/0/02/Print_Gallery_by_M._C._Escher.jpg)

#### Nested systems of continuations

The previous version of the tco module (related to the ideas [here](http://baruchel.github.io/python/2015/07/10/continuation-passing-style-in-python/) wouldn't allow to nest several distinct systems of functions passing their own continuation. The code of the last version was carefully redesigned for allowing it. See the code below:

~~~python
from tco import C

escape = C(lambda f: lambda n: n)()

def trap1(self, k1):
  def code():
    while True:
      trap2(k1)
  return code
trap1 = C(trap1)(escape)

def trap2(self):
  def code(k):
    k(42)
  return code
trap2 = C(trap2)()
~~~

Again, you can see an infinite loop, but the new thing is that the function called from the infinite loop in `trap1` isn't a classical python function as previously but _another_ function called `trap2` optimized by the module tco. One could wonder whether the system is clever enough to understand that the `k(42)` call must not be confused with the continuation of the innermost C function or not, but it actually is: the call to `trap1()` is (as expected) evaluated to 42.

You may think it as a kind of `goto` statement but rather than the old _horizontal_ goto jumping from a location to another one, it should be rather thought as a _vertical_ goto jumping from somewhere in the stack to a previous level.
