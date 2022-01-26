<h1>EZ-CPS</h1>
<h2>Teaching Students CPS-Transformations in Scheme</h2>
<hr>
<a href="https://rose-easy-cps.web.app/" target="_blank">Live Version of Website</a>

<h3> What is this?</h3>
This site was developed as part of an undergraduate senior thesis by <a href="https://www.linkedin.com/in/stephen-p-4b637b111/" target="_blank">Stephen Payne</a>.<br><br>
Students taking Rose-Hulman’s CSSE304 Programming Language Concepts (PLC) learn a style of coding known as continuation passing style (CPS) which requires that all substantial functions calls be in what’s known as tail-form. Correctly implementing this way of coding significantly improves the efficiency of a program. That said, PLC students regularly find the topic difficult to understand and the programming style even harder to write for a variety of reasons, one of which is the lack of CPS oriented debugging tools when writing code. But would providing students CPS-tailored feedback improve their ability to produce continuation passing style (CPS) transformations?


<h3>Tech Used</h3>
<ul>
  <li><b>Firebase Cloud Firestore</b> - for data collection (see <a href="#exp">Original Experiment</a> for more details)</li>
  <li><b>LIPS Scheme Interpreter</b> - for executing Scheme code including the non-tail call detector</li>
  <li><b>Ace Code Editor</b> - for text editor</li>
  <li><b>Bootstrap 4.0</b> - for CSS & UI</li>
</ul>

<h3>Original Experiment</h3>
As this was developed for a senior thesis, context on the experiment may better help you understand what is being checked, what data is being collected, and why.
As of the time of this update, the study/experiment has not yet been ran. Data collection should be finished by 1/28/22. 

<b>The following is the experiment explanation submitted to an approved by Rose-Hulman Institute of Technology's IRB supervisor, Dan Morris.</b>

<h4>IRB Submission Explanation</h4>
Students will be randomized into 1 of 2 groups. Students will be shown a series of non-CPS procedures/functions written in the programming language Scheme that they will be asked to transform to CPS form within a given time limit displayed on the screen (transforming procedures to CPS is a common task done in PLC).  While solving these problems, students can run their code against automated test cases to check its correctness before submitting their code to a database from grading and moving on to the next question. 
Whenever students run or submit code, if the students opt in to having their data collected, the following information will be logged to a Google Firestore database: their code, UUID, list of passed/failed test cases, whether the code is in tail-form, group number, and the time remaining on the problem. If students opt out of data collection, none of this data will be saved. All collected results will be anonymous, and no one, including the PLC instructor, faculty, myself, etc. will be able to see who has chosen to participate so to protect the students’ privacy.

Upon running the automated tests, subjects in Group 2 will also receive CPS feedback--whether the code is in tail-form & the name of non-tail function calls—while group 1 receives no info other than the result of the test cases. Upon clicking a submit button, students will formally submit their code for grading, and both groups will be told by the software whether their code is in tail form before automatically moving to the next question.

This exercise will be treated as an ungraded, in-class activity. Students will not receive or lose any credit for choosing to or not to participate.
 
