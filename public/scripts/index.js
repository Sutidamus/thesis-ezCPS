document.querySelector("button").onclick = () => {
    let group = document.querySelector("#groupSelect").value
    console.log(group);

    let canCollectData = parseInt(document.querySelector("#recordData").value)

    let uuid = uuidv4();
    window.location.href = `editor.html?group=${group}&uuid=${uuid}&data=${canCollectData}`
}