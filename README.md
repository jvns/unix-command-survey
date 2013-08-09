unix-command-survey
===================

Visualization of a [survey](https://docs.google.com/forms/d/1XNMoSdfYFe_WkPfU--M88oL00PDLIOAo1HxjhZvZYJ4/viewform) that 1500 people filled out about the top commands in their `.bash_history`.

You can see the visualization here: http://jvns.ca/projects/unix-command-survey/graph.html

How it's generated:

- For each command, create a binary vector of which people have the command in their history (1 if they do, 0 if they don't)
- Calculate the correlations between the command vectors
- Display the resulting graph using D3!

The code is more or less a mess, but feel free to submit pull requests if you want to improve something. 
