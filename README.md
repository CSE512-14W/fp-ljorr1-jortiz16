Galactic Merger Trees in D3
===============

##Team Members
- Laurel Orr ljorr1@cs.washington.edu
- Jennifer Ortiz:  jortiz16@cs.washington.edu

##Development Process:
We worked throughout the sections described below. We both built the initial queries necessary to construct the tree. Also, we both worked on the layout as a whole (making sure all the components fit together well). During the development process we would iterate on the visualization based on the feedback we got from either the astronomers or instructors. Since we had no initial experience to Javascript or D3, we made sure to look at several tutorials and examples to help us along the process. Specifically, this is what we each focused on and how we split the responsibilities:

* Laurel
  * Tree layout with time axis
  * Node/Edges annotations (color, size based on mass, reading node/edge information from pre-computed data files)
  * Defined tree similarity metric and added navigational slider with thumbnails
* Jennifer
  * Initial data gathering
  * Mass and Particle filter graphs/legends and added highlighting blur
  * Extra checkbox features and adding luminosity feature

##Abstract
With the help from high-performance computing, scientists have been able to run large scale simulations to model the behavior of complex, natural systems. The amount of data generated is so massive it becomes challenging to analyze and interact with the data using traditional methods. In the field of cosmology, astronomers have run these large scale simulations to model the behavior of particles interacting from the Big Bang up to present day (a span of 14 billion years). The ultimate goal behind these simulations is to better understand how galaxies such as the Milky Way form and evolve over time. In this project, we develop a visualization that details the history behind galaxies from present day by generating merger trees. Some features developed include the ability to easily observe the structure of the merger trees, learn more about the halos through user-friendly navigation and be able to highlight specific halos in the tree structure by defining mass and particle count.

##Running Instructions
Access our visualization at http://cse512-14w.github.io/fp-ljorr1-jortiz16/ or download this repository and run `python -m SimpleHTTPServer 9000` and access this from http://localhost:9000/.

##Paper and Poster Link
[Poster](https://github.com/CSE512-14W/fp-ljorr1-jortiz16/raw/master/final/poster-ljorr1-jortiz16.pdf),
[Final Paper](https://github.com/CSE512-14W/fp-ljorr1-jortiz16/raw/master/final/paper-ljorr1-jortiz16.pdf) 

##Summary Image
![Image](https://github.com/CSE512-14W/fp-ljorr1-jortiz16/raw/master/summary.png)
