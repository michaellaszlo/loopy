# Loopy

## An implementation of the Loopy game, also known as Slitherlink, Takegaki, Fences, and Loop the Loop


### Background

This web page is a solution verifier for Loopy. The rules of the game
are described by Simon Tatham:

http://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/loopy.html#loopy

Wikipedia has an extensive analysis:

https://en.wikipedia.org/wiki/Slitherlink

If the game seems hard, you're right. It has been shown to be NP-complete.


### Usage

Click on the `+` button in the upper right corner of a square to add a
number signifying how many sides of the square should be active. This
number appears in the top half of the square. Click on `+` and `-`
to adjust the number.

The number in the bottom half of the square tells you how many sides of
the square are currently active. The puzzle is solved when every number
in the top half of a square is satisfied by the number in the bottom
half of the square.

Click on edges to form a path.

The color of the path indicates its state:

- Red: this is not a loop
- Black: this is a loop but not a solution to the current puzzle
- Green: this is a loop that solves the puzzle

![Loopy game](screenshot.png)

