const SUBMISSION_TIMEOUT = 5000;
const submissionState = {
  LOADING: "LOADING",
  IN_TAIL: "IN_TAIL",
  NO_TAIL: "NO_TAIL",
  NO_CHECK_TAIL: "NO_CHECK_TAIL",
};

const runState = {
  IN_TAIL: "RUN_IN_TAIL",
  NO_TAIL: "RUN_NO_TAIL",
};

const debugTailCalls = (code) => {
  console.log("Debugging Tail Calls for: ", code);
  lips.exec(`(non-tail-funcs ${code})`).then((r) => console.log(r));
};

const debugParseExp = (code) => {
  console.log("Debugging Parse Exp for: ", code);
  lips.exec(`(parse-exp ${code})`).then((r) => console.log(r));
};

const debugSyntaxExpand = (code) => {
  console.log("Debugging Parse Exp for: ", code);
  lips.exec(`(syntax-expand (parse-exp ${code}))`).then((r) => console.log(r));
};

const submissionDB = firebase.firestore().collection("Submissions");

var { exec } = lips;
var currentEditorBody = 0;
var nonTailCalls = [];
var originalPrimProcs = [
  "+",
  "-",
  "*",
  "add1",
  "sub1",
  "cons",
  "=",
  "/",
  ">=",
  "<=",
  "<",
  ">",
  "list",
  "list?",
  "null?",
  "eq?",
  "equal?",
  "length",
  "list->vector",
  "list?",
  "not",
  "vector->list",
  "vector?",
  "pair?",
  "number?",
  "caar",
  "car",
  "cdr",
  "cadar",
  "cadr",
  "cdar",
  "cddr",
  "symbol?",
  "zero?",
  "procedure?",
  "set-car!",
  "set-cdr!",
  "atom?",
  "vector-set!",
  "display",
  "newline",
  "assq",
  "make-vector",
  "vector-ref",
  "vector-set!",
  "apply",
  "map",
  "vector",
  "void",
  "ormap",
  "quotient",
  "append",
  "eqv?",
  "list-tail",
  "quote",
  "apply-k",
  "make-k",
  "or"
];

var primProcsJS = [...originalPrimProcs];
var editorBodies = [];

const GROUP_NUMBER = parseInt(
  new URLSearchParams(window.location.search).get("group")
);

const COLLECT_DATA = parseInt(
  new URLSearchParams(window.location.search).get("data")
);

const uuid = new URLSearchParams(window.location.search).get("uuid");

// const { default: lips } = require("@jcubic/lips");
// var timeLeft = 0;
// const { default: lips } = require("@jcubic/lips");
//var curEnv = lips.env;
var questions = [
  {
    description:
      "Calculate and return the factorial of n. Expects n (a number) and k (a continuation) as parameters",
    difficulty: 1,
    extraSubstantialProcedures: ["+", "map", "append"],
    baseProc: `(define factorial 
        (lambda (n)
          (if (or (eq? 0 n) (eq? 1 n))
            1
            (* n (factorial-cps n-1))
          )
    ))`,
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
      },
    ],
    timeLimit: 300000,
    nonCPSName: "Factorial",
  },

  {
    description:
      "Returns true if x is an element of the list, and false otherwise. ",
    difficulty: 2,
    extraSubstantialProcedures: ["pair?"],
    name: "Member-CPS",
    testCases: [
      {
        code: "(member-cps 'a '(b c d 1 2 3 a) list)",
        expectedOutput: "'(#t)",
      },
    ],
    functionName: "member-cps",
    arguments: "(ch ls k)",
    timeLimit: 300000,
    nonCPSName: "Member?",
    baseProc: `
    (define member? (lambda (ch ls))
      (cond 
        [(null? ls) #f]
        [(equal? (car ls) ch) #t]
        [else (member? ch (cdr ls))]
      )
    )
    `,
  },

  {
    description:
      "Determine is the given list is a set. Takes a list and continuation as arguments.",
    difficulty: 2,
    extraSubstantialProcedures: ["member"],
    name: "Set-CPS",
    testCases: [
      {
        code: "(set?-cps '(b c d 1 2 3 a) list)",
        expectedOutput: "'(#t)",
      },
      {
        code: "(set?-cps '(b c d (a) 2 b a) (lambda(v)(cons v '())) )",
        expectedOutput: "'(#f)",
      },
      {
        code: "(set?-cps '(y 2 2 g z) (lambda (v) (if v 'cat 'dog)) )",
        expectedOutput: "'dog",
      }
    ],
    functionName: "set?-cps",
    arguments: "(ls k)",
    timeLimit: 300000,
    nonCPSName: "set?",
    baseProc: `
    (define set? (lambda (ls))
      (cond 
        [(null? ls) #t]
        [(not (pair? ls)) #f]
        [else (if (member? (car ls) (cdr ls))
          #f
          (set? (cdr ls))
          )]
      )
    )
    `,
  },
];
var questionNumber = 1;
var intervalID = 0;
var timerIntervalID = 0;
var globalTimeRemaining = 0;
var { exec, parse } = lips;
var curTestCases = [];
const htmlToElement = (html) => {
  const placeholder = document.createElement("div");
  placeholder.innerHTML = html;
  return placeholder.children.length
    ? placeholder.firstElementChild
    : undefined;
};

// function posMin(a, b){
//   if(a >= 0 && b >=0){
//     return Math.min(a,b);
//   }
//   else if(a < 0 && b >=0) return b;
//   else if(a >= 0 && b < 0) return a;
//   else return -1;
// }

// function splitExpressions(rawCode, splitExprs, ){

//   if(rawCode.length == 0) return splitExprs;
//   else{
//     if(rawCode[0] != "(")
//   }
// }

// function getNextBoundedExpression(code, stk, ind){
//   let nextOParenLoc = code.indexOf("(");
//   let nextCParenLoc = code.indexOf(")");

//   let closestInd = posMin(nextCParenLoc, nextOParenLoc);
//   closestInd >= 0 ?
// }
function clearTheConsole() {
  document.querySelector("#codeConsole").value = "";
  codeConsole.value = "";
}
async function checkTailCallSequentially(
  codeBlocksPromises,
  callbackFunc,
  passFailTestResults
) {
  if (codeBlocksPromises.length == 0) return;
  nonTailCalls = [];

  for (const func of codeBlocksPromises) {
    await func();
  }

  //TODO: DON'T RUN IF GROUP 1
  if (GROUP_NUMBER == 2) {
    let inTailForm =
      nonTailCalls.length == 0
        ? submissionState.IN_TAIL
        : submissionState.NO_TAIL;
    // document.querySelector("#tailCallFeedback").style.display = "block";
    // document.querySelector("#isInTailForm").innerHTML =
    //   nonTailCalls.length > 0 ? "NO❌" : "YES✔️";
    alertTailFeedback(inTailForm);
  }

  if (callbackFunc) {
    console.log("Chekcing tail calls: ", passFailTestResults);
    callbackFunc(passFailTestResults);
  }
}

async function evaluatePromisesSequentially(lsPromises, callbackFunc, args) {
  if (lsPromises.length == 0) return;
  let results = [];

  for (const func of lsPromises) {
    let res = await func();
    results.push(res);
  }

  callbackFunc(results, args);
}

function logToUI(msg, clearConsole) {
  const codeConsole = document.querySelector("#codeConsole");

  if (clearConsole) codeConsole.value = "";
  codeConsole.value += msg;
}

function updateTailCallUI(tailPromise) {
  tailPromise.then(() => {
    console.log("YOUR STUPID ASS TAIL CALLS UGH");
    document.querySelector("#tailCallFeedback").style.display = "block";
    document.querySelector("#isInTailForm").innerHTML =
      nonTailCalls.length > 0 ? "NO❌" : "YES✔️";
  });
}

function executeSchemeCode(rawCode) {
  const codeConsole = document.querySelector("#codeConsole");
  codeConsole.value = "";
  lips
    .exec(rawCode)
    .then((result) => {
      result.forEach((res) => {
        if (res) {
          if (typeof res === "function") {
            console.log("Procedure ::");
            console.log(res.__code__);
            if (res.__code__.car.__name__ === "lambda") {
              codeConsole.value += `<#procedure lambda>\n`;
              return;
            }
          }
          logToUI(res.toString(), true);
          // codeConsole.value += res.toString();
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
    .then((res) => {
      console.log("Printing tail calls:", nonTailCalls);
      document.getElementById("tailCallFeedback").style.display = "block";
      document.getElementById("isInTailForm").innerHTML =
        nonTailCalls.length > 0 ? "NO❌" : "YES✔️";
    })
    .catch((e) => console.log(e));
}

function alertBS(status) {
  console.log("Calling AlertBS with status = ", status);
  var alertPlaceholder = document.getElementById("liveAlertPlaceholder");
  var alertTrigger = document.getElementById("liveAlertBtn");

  var wrapper = document.createElement("div");

  switch (status) {
    case submissionState.IN_TAIL:
      wrapper.innerHTML =
        '<div class="alert alert-' +
        "success" +
        ' alert-dismissible" role="alert">' +
        `<h4 class="alert-heading">CODE SUBMITTED: Well done!</h4>
          <h5>The code you submitted was in CPS form!</h5>
          <hr>
          <p class="mb-0">Moving to the next problem in 3 seconds.</p>`;
      break;

    case submissionState.LOADING:
      wrapper.innerHTML =
        '<div class="alert alert-' +
        "info" +
        ' alert-dismissible" role="alert">' +
        `${
          COLLECT_DATA
            ? "Loading...Submitting Code to Firebase"
            : "Loading...skipping server submission."
        }`;
      break;

    case submissionState.NO_TAIL:
      wrapper.innerHTML =
        '<div class="alert alert-' +
        "danger" +
        ' alert-dismissible" role="alert">' +
        `<h4 class="alert-heading">CODE SUBMITTED: Whoops!</h4>
          <h5>The code you submitted NOT in CPS form!</h5>
          <hr>
          <p class="mb-0">Moving to the next problem in 3 seconds.</p>`;
      break;

    case submissionState.NO_CHECK_TAIL:
      wrapper.innerHTML =
        '<div class="alert alert-' +
        "info" +
        ' alert-dismissible" role="alert">' +
        `<h4 class="alert-heading">CODE SUBMITTED: Tail-Form not Checked</h4>
        <h5>The code you submitted did not have a (define) statement, so tail-form wasn't checked.</h5>
        <hr>
        <p class="mb-0">Moving to the next problem in 3 seconds.</p>`;
      break;

    default:
      wrapper.innerHTML = "";
      break;
  }

  alertPlaceholder.innerHTML = "";
  alertPlaceholder.appendChild(wrapper);
}

function alertTailFeedback(status) {
  console.log("Calling AlertBS with status = ", status);
  var alertPlaceholder = document.getElementById("liveAlertPlaceholder");
  var alertTrigger = document.getElementById("liveAlertBtn");

  var wrapper = document.createElement("div");

  switch (status) {
    case submissionState.IN_TAIL:
      wrapper.innerHTML =
        '<div class="alert alert-' +
        "success" +
        ' alert-dismissible" role="alert">' +
        `<h4 class="alert-heading">IN TAIL FORM? <b>YES!</b></h4>
            <h5>The code you submitted has no non-taill calls to substantial procedures!</h5>`;
      break;

    case submissionState.NO_TAIL:
      wrapper.innerHTML =
        '<div class="alert alert-' +
        "danger" +
        ' alert-dismissible" role="alert">' +
        `<h4 class="alert-heading">IN TAIL FORM? <b>NO!</b></h4>
            <h5>The code you submitted contains the following substantial procedure calls in NON-tail position:</h5>
            <ul>
              ${nonTailCalls.map((rator) => `<li class="nonTailCall">${rator.id}</li>`)}
            </ul>`;
      break;

    case submissionState.NO_CHECK_TAIL:
      wrapper.innerHTML =
        '<div class="alert alert-' +
        "info" +
        ' alert-dismissible" role="alert">' +
        `<h4 class="alert-heading">IN TAIL FORM? <b>Didn't Check</b></h4>
          <h5>The code you submitted did not have a (define) statement, so tail-form wasn't checked.</h5>`;
      break;

    default:
      wrapper.innerHTML = "";
      break;
  }

  alertPlaceholder.innerHTML = "";
  alertPlaceholder.appendChild(wrapper);
}

function setup() {}

function resizeInput() {
  this.style.width = this.value.length + "ch";
}

function processTestResults(results, args) {
  console.log("Test Case results: ", results);

  let testCaseTable = document.querySelector("table");
  let { defineBodies, submit } = args;
  let passedTestResults = [];

  results.forEach((res, ind) => {
    let didPass = true;
    let actual = "";

    //In case test case errored out
    if (typeof res[0] == "string") {
      didPass = res[1];
      actual = res[0];
    } else {
      actual = res[0].valueOf()[0].toString();
      didPass = res[0].valueOf()[1];
    }

    console.log("Test Case " + ind + ": ", res);

    console.log("didPass: ", didPass);
    document.querySelector(`#testCase${ind}Pass`).innerHTML = didPass
      ? "✔️"
      : "❌";
    document.querySelector(`#testCase${ind}Pass`).style.backgroundColor =
      didPass ? "lightgreen" : "red";

    document.querySelector(`#testCase${ind}Actual`).innerHTML = actual;

    didPass ? passedTestResults.push(true) : passedTestResults.push(false);
  });

  console.log("Would be updating test case UI");

  testCaseTable.style.display = "block";

  // console.log("Checking tail form for: ", rawCode);
  let definePromises = [];
  // checkTailCalls(rawCode);
  defineBodies.forEach((defi) => {
    let tailCheckPromises = () =>
      new Promise((resolve) => {
        let co = `(non-tail-funcs '(define ${defi})`;

        console.log(co);
        resolve(lips.exec(co));
      });

    definePromises.push(tailCheckPromises);
  });

  if (definePromises.length) {
    submit
      ? checkTailCallSequentially(
          definePromises,
          submitToFirebaseAndMove,
          passedTestResults
        )
      : checkTailCallSequentially(
          definePromises,
          submitToFirebase,
          passedTestResults
        );
  } else {
    nonTailCalls = [];
    // let rawCode = ace.edit('editor').getValue();

    // let tailCheckPromises = () =>
    //   new Promise((resolve) => {
    //     if(rawCode[0] == "(") rawCode = `'${rawCode}`;
    //     let co = `(non-tail-funcs ${rawCode})`;

    //     console.log(co);
    //     resolve(lips.exec(co));
    //   });
    nonTailCalls.push({ id: "error-no-define" });
    // definePromises.push()
    submit
      ? submitToFirebaseAndMove(passedTestResults)
      : submitToFirebase(passedTestResults);
  }
}

function updateUIWithByQuestion(questionNumber) {
  document.querySelector("#submitCodeBtn").disabled = false;
  document.querySelector("#runCodeBtn").disabled = false;
  let testCaseTbody = document.querySelector("tbody");

  let currentQuestion = questions[questionNumber - 1];

  let {
    description,
    difficulty,
    name,
    testCases,
    timeLimit,
    extraSubstantialProcedures,
    arguments,
    functionName,
    nonCPSName,
    baseProc,
  } = currentQuestion;
  globalTimeRemaining = timeLimit/1000;
  console.log("Description: ", description);
  console.log("Difficulty: ", difficulty);
  console.log("name: ", name);
  console.log("testCases: ", testCases);
  console.log("timeLimit: ", timeLimit);
  console.log("Substantial Procedures: ", extraSubstantialProcedures);

  document.querySelector("#problemTitle").textContent = name;
  document.querySelector("#problemDescription").innerHTML = description;

  let substantialProcs = document.querySelector("#substantialProcedureList");
  document.querySelector("#nonCPSProcName").textContent = nonCPSName;
  document.querySelector("#nonCPSImplementation").innerHTML = baseProc;
  substantialProcs.innerHTML = "";

  primProcsJS = originalPrimProcs;
  extraSubstantialProcedures.forEach((procID) => {
    substantialProcs.appendChild(htmlToElement(`<li>${procID}</li>`));
    primProcsJS = primProcsJS.filter((v) => v != procID);
  });

  curTestCases = testCases;

  //Clear text editor
  ace.edit("editor").setValue("");

  // document.querySelector("table").style.display = "none";
  document.querySelector("tbody").innerHTML = "";

  if (GROUP_NUMBER == 2) {
    document.querySelector("#isInTailForm").innerHTML = "";
    document.querySelector("#tailCallFeedback").style.display = "none";
  }

  // let promises = [];
  document.querySelector("#runCodeBtn").onclick = onCodeRun;
  document.querySelector("#submitCodeBtn").onclick = onSubmit;

  //testCaseTable
  curTestCases = testCases;

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
    actual.innerHTML = "-";
    passFail.innerHTML = "-";

    console.log("Pushing test case promise!!!");
  });
  
  updateTimer(timeLimit);
}

function onCodeRun() {
  clearInterval(timerIntervalID);
  clearInterval(intervalID);

  let currentQuestion = questions[questionNumber - 1];
  document.querySelector("#submitCodeBtn").disabled = true;
  document.querySelector("#runCodeBtn").disabled = true;
  let { testCases, arguments } = currentQuestion;

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
    .then((en) => {
      // Execute test cases
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

        let testCaseCheck = () =>
          new Promise((resolve) => {
            let co = `(let ([result ${tc.code}]) (values result (equal? result ${tc.expectedOutput})))`;

            console.log(co);
            resolve(
              lips.exec(co, en).catch((e) => [`Error: ${e.message}`, false])
            );
          });

        promises.push(testCaseCheck);
      });

      return promises;
    })
    .then((promArray) => {
      // Update UI after test cases; Check tail-call
      console.log("Promise Array: ", promArray);
      evaluatePromisesSequentially(promArray, processTestResults, {
        defineBodies: defineBodies,
        submit: 0,
      });
    })
    .catch((err) => {
      console.log(err);
      codeConsole.value = err.toString();

      onCodeErrorRun(lips.env, rawCode);
    });
}

function onCodeError(en, rawCode) {
  let currentQuestion = questions[questionNumber - 1];
  let { testCases, arguments } = currentQuestion;

  let testCaseTbody = document.querySelector("tbody");
  const codeConsole = document.querySelector("#codeConsole");
  codeConsole.value = "";
  let defineBodies = rawCode.split("(define ").slice(1);

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

    let testCaseCheck = () =>
      new Promise((resolve) => {
        let co = `(let ([result ${tc.code}]) (values result (equal? result ${tc.expectedOutput})))`;

        console.log(co);
        resolve(lips.exec(co, en).catch((e) => [`Error: ${e.message}`, false]));
      });

    promises.push(testCaseCheck);
  });

  let promArray = promises;

  console.log("Promise Array: ", promArray);
  evaluatePromisesSequentially(promArray, processTestResults, {
    defineBodies: defineBodies,
    submit: 1,
  });
}

function onCodeErrorRun(en, rawCode) {
  let currentQuestion = questions[questionNumber - 1];
  let { testCases, arguments } = currentQuestion;

  let testCaseTbody = document.querySelector("tbody");
  const codeConsole = document.querySelector("#codeConsole");
  codeConsole.value = "";
  let defineBodies = rawCode.split("(define ").slice(1);

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

    let testCaseCheck = () =>
      new Promise((resolve) => {
        let co = `(let ([result ${tc.code}]) (values result (equal? result ${tc.expectedOutput})))`;

        console.log(co);
        resolve(lips.exec(co, en).catch((e) => [`Error: ${e.message}`, false]));
      });

    promises.push(testCaseCheck);
  });

  let promArray = promises;

  console.log("Promise Array: ", promArray);
  evaluatePromisesSequentially(promArray, processTestResults, {
    defineBodies: defineBodies,
    submit: 0,
  });
}

function onSubmit() {
  clearInterval(timerIntervalID);
  clearInterval(intervalID);
  let currentQuestion = questions[questionNumber - 1];
  document.querySelector("#submitCodeBtn").disabled = true;
  document.querySelector("#runCodeBtn").disabled = true;
  let { testCases, arguments } = currentQuestion;

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
    .then((en) => {
      // Execute test cases
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

        let testCaseCheck = () =>
          new Promise((resolve) => {
            let co = `(let ([result ${tc.code}]) (values result (equal? result ${tc.expectedOutput})))`;

            console.log(co);
            resolve(
              lips.exec(co, en).catch((e) => [`Error: ${e.message}`, false])
            );
          });

        promises.push(testCaseCheck);
      });

      return promises;
    })
    .then((promArray) => {
      // Update UI after test cases; Check tail-call
      console.log("Promise Array: ", promArray);
      evaluatePromisesSequentially(promArray, processTestResults, {
        defineBodies: defineBodies,
        submit: 1,
      });
    })
    .catch((err) => {
      console.log(err);
      codeConsole.value = err.toString();

      onCodeError(lips.env, rawCode);
    });
}

function showTailFeedback(submitAndMove) {

  let inTailForm =
    nonTailCalls.length == 0
      ? submissionState.IN_TAIL
      : submissionState.NO_TAIL;

  if (nonTailCalls.length == 1) {
    inTailForm =
      nonTailCalls[0].id == "error-no-define"
        ? submissionState.NO_CHECK_TAIL
        : inTailForm;
  }

  if(GROUP_NUMBER == 1){
    submitAndMove ? alertBS(inTailForm) : alertBS();
    return;
  }

  submitAndMove ? alertBS(inTailForm) : alertTailFeedback(inTailForm);
}

function submitToFirebaseAndMove(passFailTestResults) {
  let editor = ace.edit("editor");
  let rawCode = editor.getValue();
  let timeRemaining = document.querySelector("#countdownTimer").innerHTML;
  let minSec = timeRemaining.split(":").map(parseFloat);

  clearTheConsole();

  let submission = {
    code: rawCode,
    uuid: uuid,
    group: GROUP_NUMBER,
    timeRemaining: globalTimeRemaining,
    inTailForm: nonTailCalls.length == 0,
    testResults: passFailTestResults,
  };

  console.log("Submission to Firebase: ", submission);
  alertBS(submissionState.LOADING);
  if (COLLECT_DATA) {
    submissionDB
      .add(submission)
      .then((docId) => {
        console.log("Successful Submission: ", docId);
        showTailFeedback(1);
        questionNumber++;
        setTimeout(() => {
          if (questionNumber - 1 < questions.length) {
            alertBS();
            updateUIWithByQuestion(questionNumber);
          } else {
            window.location.href = "end.html";
          }
        }, SUBMISSION_TIMEOUT);
      })
      .catch((e) => console.log("Error Occured on submission", e));
  } else {
    showTailFeedback(1);
    questionNumber++;
    setTimeout(() => {
      if (questionNumber - 1 < questions.length) {
        alertBS();
        updateUIWithByQuestion(questionNumber);
      } else {
        window.location.href = "end.html";
      }
    }, SUBMISSION_TIMEOUT);
  }
}

function submitToFirebase(passFailTestResults) {
  let editor = ace.edit("editor");
  let rawCode = editor.getValue();
  // let timeRemaining = document.querySelector("#countdownTimer").innerHTML;
  // let minSec = timeRemaining.split(":").map(parseFloat);

  let submission = {
    code: rawCode,
    uuid: uuid,
    group: GROUP_NUMBER,
    timeRemaining: globalTimeRemaining,
    inTailForm: nonTailCalls.length == 0,
    testResults: passFailTestResults,
  };

  console.log("Submission to Firebase: ", submission);
  alertBS(submissionState.LOADING);
  if (COLLECT_DATA) {
    submissionDB
      .add(submission)
      .then((docId) => {
        document.querySelector("#runCodeBtn").disabled = false;
        document.querySelector("#submitCodeBtn").disabled = false;

        console.log("Successful Submission: ", docId);

        showTailFeedback(0);
        updateTimer(globalTimeRemaining*1000)
      })
      .catch((e) => {
        document.querySelector("#runCodeBtn").disabled = false;
        document.querySelector("#submitCodeBtn").disabled = false;

        // Tail Feedback should show even in case of error
        console.log("Error Occured on submission", e);
        if (GROUP_NUMBER == 2) {
          let inTailForm =
            nonTailCalls.length == 0
              ? submissionState.IN_TAIL
              : submissionState.NO_TAIL;

          alertTailFeedback(inTailForm);
        } else alertBS();
        updateTimer(globalTimeRemaining*1000)
      });
  } else {
    document.querySelector("#runCodeBtn").disabled = false;
    document.querySelector("#submitCodeBtn").disabled = false;

    showTailFeedback(0);
    updateTimer(globalTimeRemaining*1000)
  }
}

function updateTimer(timeLimit) {
  if (intervalID > 0 && timerIntervalID > 0) {
    clearInterval(intervalID);
    clearInterval(timerIntervalID);
  }

  intervalID = setInterval(() => {
    onSubmit();
  }, (globalTimeRemaining * 1000)+1000);

  // let now = new Date().getTime();
  // let countDownDate = now + timeLimit;

  timerIntervalID = setInterval(() => {
    globalTimeRemaining--;

    let minutes = Math.floor(globalTimeRemaining/60);;
    let seconds = globalTimeRemaining%60;

    let secondsText = seconds;
    secondsText = seconds < 10 ? `0${seconds}`: secondsText;

    if (globalTimeRemaining >= 0) {
      document.querySelector(
        "#countdownTimer"
      ).innerHTML = `${minutes}:${secondsText}`;
    }
  }, 1000);
}

function main() {
  setup();
  console.log("Question Number: ", questionNumber);
  updateUIWithByQuestion(questionNumber); //1-indexed for readability
}

main();
