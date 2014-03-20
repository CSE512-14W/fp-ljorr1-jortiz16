function activateSlider() {
    //vars
    var current = $("#current", $("#sliderContent")),
    similar = $("#similarHalo", $("#sliderContainer")),
    viewer = $("#similarities", $("#sliderContent")),
    conveyor = $(".content-conveyor", $("#sliderContent")),
    item = $(".item", $("#similarities"));
    //console.log(item.length);
    //set width current
    current.css("width", parseInt(item.css("width")));
    //sets text left position
    similar.css("left", parseInt(item.css("width"))+8);
    //set width viewer
    viewer.css("width", parseInt($("#sliderContent").css("width")) - 5 - parseInt(item.css("width")));
    /*viewer.css("margin-left", parseInt(item.css("width")));*/
    //set length of conveyor
    conveyor.css("width", item.length * parseInt(item.css("width")));
    //console.log(item.length, item.css("width"), ("#similarities", $("#sliderContent")).css("width"));
    //config
    // var sliderOpts = {
    //     max: (item.length * parseInt(item.css("width"))) - parseInt($("#similarities", $("#sliderContent")).css("width")),
    //     slide: function(e, ui) { 
    //         conveyor.css("left", "-" + ui.value + "px");
    //     }
    // };
    // $("#slider").css("width", parseInt(viewer.css("width")));
    // $("#slider").css("left", parseInt(item.css("width"))+10);
    // //create slider
    // $("#slider").slider(sliderOpts);
}