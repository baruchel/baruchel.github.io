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

The [tco](https://github.com/baruchel/tco) module is a powerful module made of a couple of lines allowing mainly:

  * tail-call optimization
  * optimized tail-recursion
  * continuation-passing style
  * pseudo call-with-current-continuation

Two ideas lie behind these features: repeatedly call functions without having the size of the execution stack increasing and possibly jump back from a place in the execution stack to a previous one _without passing through the intermediate calls and their own waiting `return` statements_.

#### A first example: a binary search tree


