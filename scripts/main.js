var {exec} = lips;
var currentEditorBody = 0;
var nonTailCalls = [];
var originalPrimProcs = ["+","-","*","add1","sub1","cons","=","/",">=","<=","<",">","list","list?","null?","eq?","equal?","length","list->vector","list?","not","vector->list","vector?","pair?","number?","caar","car","cdr","cadar","cadr","cdar","cddr","symbol?","zero?","procedure?","set-car!","set-cdr!","atom?","vector-set!","display","newline","assq","make-vector","vector-ref","vector-set!","apply","map","vector","void","ormap","quotient","append","eqv?","list-tail","quote"];
var primProcsJS = [...originalPrimProcs];
var editorBodies = [];

const groupNumber = parseInt(new URLSearchParams(window.location.search).get('group'));
// const { default: lips } = require("@jcubic/lips");

// const { default: lips } = require("@jcubic/lips");
//var curEnv = lips.env;
var questions = [
  {
    description: "Calculate and return the factorial of n",
    difficulty: 1,
    extraSubstantialProcedures: ["+", "-", "map", "append"],
    name: "Factorial-CPS",
    functionName: "factorial-cps",
    arguments: "(n k)",
    testCases: [
      {
        code: "(factorial-cps 0 list)",
        expectedOutput: "'(1)",
      },
      {
        code: "(factorial-cps 1 list)",
        expectedOutput: "'(1)",
      },
      {
        code: "(factorial-cps 3 list)",
        expectedOutput: "'(6)",
      }
    ],
    timeLimit: 30000,
  },

  {
    description:
      "Returns true if x is an element of the list, and false otherwise. ",
    difficulty: 2,
    extraSubstantialProcedures: ["cons", "pair?", "null?"],
    name: "Member-CPS",
    testCases: [
      {
        code: "(member-cps 'a '(b c d 1 2 3 a) list)",
        expectedOutput: "'(t)",
      }],
    functionName: "member-cps",
    arguments: "(ch ls k)",
    timeLimit: 30000,
  },
];
var questionNumber = 1;
var intervalID = 0;
var timerIntervalID = 0;
var remainingTime = 0;
var { exec, parse } = lips;
var curTestCases = [];
const htmlToElement = (html) => {
  const placeholder = document.createElement("div");
  placeholder.innerHTML = html;
  return placeholder.children.length
    ? placeholder.firstElementChild
    : undefined;
};

async function checkTailCallSequentially (codeBlocksPromises){
  if(codeBlocksPromises.length == 0) return;
  nonTailCalls = [];

  // console.log("YOUR PRECIOUS LITTLE TAIL CALLS: ", nonTailCalls);
  for(const func of codeBlocksPromises){
    await func();
  }
    document.querySelector("#tailCallFeedback").style.display = "block";
    document.querySelector("#isInTailForm").innerHTML = nonTailCalls.length > 0 ? "NO❌" : "YES✔️";
  // let tailPromise = codeBlocksPromises.reduce((prev, prom, ind) => {
    
  //   return prev
  //   .then(res =>prom)
  // }, Promise.resolve())

  // Promise.resolve(tailPromise).then(res => {
  //   document.querySelector("#tailCallFeedback").style.display = "block";
  //       document.querySelector("#isInTailForm").innerHTML = nonTailCalls.length > 0 ? "NO❌" : "YES✔️";
  // })
  // tailPromise.then(() => {
  //   console.log("YOUR PRECIOUS LITTLE TAIL CALLS")
  // })
  // updateTailCallUI(tailPromise);

}

function updateTailCallUI(tailPromise){
  // console.log("Tail Promise: " , tailPromise);
  // console.log("nonTailCalls in UPDATE: ", nonTailCalls);
  tailPromise.then(() => {
    console.log("YOUR STUPID ASS TAIL CALLS UGH")
    document.querySelector("#tailCallFeedback").style.display = "block";
    document.querySelector("#isInTailForm").innerHTML = nonTailCalls.length > 0 ? "NO❌" : "YES✔️";
  })

}

function executeSchemeCode(rawCode) {
  const codeConsole = document.querySelector("#codeConsole");
  codeConsole.value = "";
  lips
    .exec(rawCode)
    .then((result) => {
      result.forEach((res) => {
        if (res) {
          // console.log("ResultType: ", typeof(res))
          if (typeof res === "function") {
            console.log("Procedure ::");
            console.log(res.__code__);
            if (res.__code__.car.__name__ === "lambda") {
              codeConsole.value += `<#procedure lambda>\n`;
              return;
            }
          }

          codeConsole.value += res.toString();

          // lips.exec(testCases[0]).then(results => results.forEach(r => console.log(r))).catch(e => console.log(e))
        }
      });
    })
    .then(() => {
      checkTailCalls(rawCode);
    })
    .catch((err) => {
      console.log(err);
      codeConsole.value = err.toString();
    });
}

function checkTailCalls(rawCode) {
  let code = rawCode;
  console.log(rawCode[0]);
  if (rawCode[0] == "(") {
    code = `'${code}`;
  }
  nonTailCalls = [];
  exec(`(non-tail-funcs ${code})`)
    .then((res) =>{   
      console.log("Printing tail calls:", nonTailCalls);
      document.getElementById("tailCallFeedback").style.display = "block";
      document.getElementById("isInTailForm").innerHTML = nonTailCalls.length > 0 ? "NO❌" : "YES✔️";
    })
    .catch((e) => console.log(e));
}

function setup() {
}

function resizeInput() {
  this.style.width = this.value.length + "ch";
}

function updateUIWithByQuestion(questionNumber) {
  let currentQuestion = questions[questionNumber - 1];

  let {
    description,
    difficulty,
    name,
    testCases,
    timeLimit,
    extraSubstantialProcedures,
    arguments,
    functionName
  } = currentQuestion;

  console.log("Description: ", description);
  console.log("Difficulty: ", difficulty);
  console.log("name: ", name);
  console.log("testCases: ", testCases);
  console.log("timeLimit: ", timeLimit);
  console.log("Substantial Procedures: ", extraSubstantialProcedures);

  document.querySelector("#problemTitle").textContent = name;
  document.querySelector("#problemDescription").innerHTML = description;
  
  let substantialProcs = document.querySelector("#substantialProcedureList");

  substantialProcs.innerHTML = "";

  
  extraSubstantialProcedures.forEach((procID) => {
    substantialProcs.appendChild(htmlToElement(`<li>${procID}</li>`));
    primProcsJS = primProcsJS.filter(v => v != procID);
  });

  
  curTestCases = testCases;

  //Clear text editor
  ace.edit("editor").setValue("");

  // let promises = [];
  document.querySelector("#runCodeBtn").onclick = () => {
    var editor = ace.edit("editor");
    let rawCode = editor.getValue();

    // let defineFuncRawCode = `(define ${functionName} (lambda ${arguments} ${rawCode}))`
    let testCaseTable = document.querySelector("table");
    let testCaseTbody = document.querySelector("tbody");
    const codeConsole = document.querySelector("#codeConsole");
    codeConsole.value = "";
    let defineBodies = rawCode.split("(define ").slice(1);
    lips
      .exec(rawCode)
      .then((result) => {
        
        result.forEach((res) => {
          if (res) {
            // console.log("ResultType: ", typeof(res))
            if (typeof res === "function") {
              console.log("Procedure ::");
              console.log(res.__code__);
              if (res.__code__.car.__name__ === "lambda") {
                codeConsole.value += `<#procedure lambda>\n`;
                return;
              }
            }

            codeConsole.value += res.toString();
            return lips.env;
            // lips.exec(testCases[0]).then(results => results.forEach(r => console.log(r))).catch(e => console.log(e))
          }
        });
      })
      .then((en) => { // Execute test cases
        let promises = [];
        testCaseTbody.innerHTML = "";
        // let curEnv = {...lips.env};
        testCases.forEach((tc, ind) => {
          let row = testCaseTbody.insertRow();
          let passFail = row.insertCell(0);
          let testCaseText = row.insertCell(1);
          let actual = row.insertCell(2);
          let expected = row.insertCell(3);

          passFail.id = `testCase${ind}Pass`;
          actual.id = `testCase${ind}Actual`;
          expected.id = `testCase${ind}Expected`;

          testCaseText.innerHTML = tc.code;
          expected.innerHTML = tc.expectedOutput;

          console.log("Pushing test case promise!!!");
          promises.push(new Promise((resolve, reject) => {
            console.log(tc.code);
            resolve(lips.exec(`(let ([result ${tc.code}]) (values result (equal? result ${tc.expectedOutput})))`, en));
          }));
        });

        return promises;
      })
      .then((promArray) => { // Update UI after test cases; Check tail-call
        console.log("Promise Array: ", promArray);
        Promise.all(promArray)
          .then(results => {
            console.log("Test Case results: ", results);
            results.forEach((res, ind) => {
              console.log("Test Case " + ind +": ", res)
              let actual = res[0].valueOf()[0].toString();
              let didPass = res[0].valueOf()[1];
              document.querySelector(`#testCase${ind}Pass`).innerHTML = didPass ?"✔️" :"❌"; 
              document.querySelector(`#testCase${ind}Pass`).style.backgroundColor =
                didPass ? "lightgreen" : "red";
              
              document.querySelector(`#testCase${ind}Actual`).innerHTML = actual;
            });
            console.log("Would be updating test case UI");
          })
          .then(() => {
            testCaseTable.style.display = "block";
          })
          .then(() => {
            
            if(groupNumber == 2){
              // let funcBody = `(lambda ${arguments} ${rawCode})`;
              console.log("Checking tail form for: ", rawCode);
              let definePromises = [];
              // checkTailCalls(rawCode);
              defineBodies.forEach(defi => {
                let tailCheckPromises = () => new Promise((resolve) =>
                  {
                    let co =`(non-tail-funcs '(define ${defi})`
                    
                  console.log(co); 
                  resolve(lips.exec(co))
                }
                )

                definePromises.push(tailCheckPromises);
              })

              checkTailCallSequentially(definePromises);
              
            }
            else{
              console.log("Not checking tail calls");
            }  
          })
          .catch(er => {
            codeConsole.value = "Error executing test cases: \n" + er.message.toString();
          });
      })
      .catch((err) => {
        console.log(err);
        codeConsole.value = err.toString();
      });
  };

  document.querySelector("#submitCodeBtn").onclick = () => {
    var editor = ace.edit("editor");
    let rawCode = editor.getValue();

    // let defineFuncRawCode = `(define ${functionName} (lambda ${arguments} ${rawCode}))`
    let testCaseTable = document.querySelector("table");
    let testCaseTbody = document.querySelector("tbody");
    const codeConsole = document.querySelector("#codeConsole");
    codeConsole.value = "";
    let defineBodies = rawCode.split("(define ").slice(1);
    lips
      .exec(rawCode)
      .then((result) => {
        
        result.forEach((res) => {
          if (res) {
            // console.log("ResultType: ", typeof(res))
            if (typeof res === "function") {
              console.log("Procedure ::");
              console.log(res.__code__);
              if (res.__code__.car.__name__ === "lambda") {
                codeConsole.value += `<#procedure lambda>\n`;
                return;
              }
            }

            codeConsole.value += res.toString();
            return lips.env;
            // lips.exec(testCases[0]).then(results => results.forEach(r => console.log(r))).catch(e => console.log(e))
          }
        });
      })
      .then((en) => { // Execute test cases
        let promises = [];
        testCaseTbody.innerHTML = "";
        // let curEnv = {...lips.env};
        testCases.forEach((tc, ind) => {
          let row = testCaseTbody.insertRow();
          let passFail = row.insertCell(0);
          let testCaseText = row.insertCell(1);
          let actual = row.insertCell(2);
          let expected = row.insertCell(3);

          passFail.id = `testCase${ind}Pass`;
          actual.id = `testCase${ind}Actual`;
          expected.id = `testCase${ind}Expected`;

          testCaseText.innerHTML = tc.code;
          expected.innerHTML = tc.expectedOutput;

          console.log("Pushing test case promise!!!");
          promises.push(new Promise((resolve, reject) => {
            console.log(tc.code);
            resolve(lips.exec(`(let ([result ${tc.code}]) (values result (equal? result ${tc.expectedOutput})))`, en));
          }));
        });

        return promises;
      })
      .then((promArray) => { // Update UI after test cases; Check tail-call
        console.log("Promise Array: ", promArray);
        Promise.all(promArray)
          .then(results => {
            console.log("Test Case results: ", results);
            results.forEach((res, ind) => {
              console.log("Test Case " + ind +": ", res)
              let actual = res[0].valueOf()[0].toString();
              let didPass = res[0].valueOf()[1];
              document.querySelector(`#testCase${ind}Pass`).innerHTML = didPass ?"✔️" :"❌"; 
              document.querySelector(`#testCase${ind}Pass`).style.backgroundColor =
                didPass ? "lightgreen" : "red";
              
              document.querySelector(`#testCase${ind}Actual`).innerHTML = actual;
            });
            console.log("Would be updating test case UI");
          })
          .then(() => {
            testCaseTable.style.display = "block";
          })
          .then(() => {
            
            if(groupNumber == 2){
              // let funcBody = `(lambda ${arguments} ${rawCode})`;
              console.log("Checking tail form for: ", rawCode);
              let definePromises = [];
              // checkTailCalls(rawCode);
              defineBodies.forEach(defi => {
                let tailCheckPromises = () => new Promise((resolve) =>
                  {
                    let co =`(non-tail-funcs '(define ${defi})`
                    
                  console.log(co); 
                  resolve(lips.exec(co))
                }
                )

                definePromises.push(tailCheckPromises);
              })

              checkTailCallSequentially(definePromises);
              
            }
            else{
              console.log("Not checking tail calls");
            }  
          })
          .catch(er => {
            codeConsole.value = "Error executing test cases: \n" + er.message.toString();
          });
      })
      .catch((err) => {
        console.log(err);
        codeConsole.value = err.toString();
      });
  };

  //testCaseTable
  curTestCases = testCases;
  updateTimer(timeLimit);
}

function updateTimer(timeLimit) {
  if (intervalID > 0 && timerIntervalID > 0) {
    clearInterval(intervalID);
    clearInterval(timerIntervalID);
  }

  intervalID = setInterval(() => {
    questionNumber++;
    if (questionNumber - 1 < questions.length) {
      console.log("Submitting Code. Moving to next problem.");
      updateUIWithByQuestion(questionNumber);
    } else {
      clearInterval(timerIntervalID);
      clearInterval(intervalID);
    }
  }, timeLimit + 1000);

  let now = new Date().getTime();
  let countDownDate = now + timeLimit + 1000;

  timerIntervalID = setInterval(() => {
    let now = new Date().getTime();
    // Find the distance between now and the count down date
    let distance = countDownDate - now;

    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (minutes >= 0 && seconds >= 0)
      document.querySelector("#countdownTimer").innerHTML =
        minutes + "m " + seconds + "s ";
  }, 500);
}

function main() {
  setup();
  console.log("Question Number: ", questionNumber);
  updateUIWithByQuestion(questionNumber); //1-indexed for readability
}

main();
