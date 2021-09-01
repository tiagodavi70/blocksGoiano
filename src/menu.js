
let numGen = 1;
let dimensions = [];
dimensions.push([]);

$(function() {
    createNewGenerator("generator_" + numGen);
});

function createNewGenerator(name) {

    let nodeText = 
    `
    <div id="${name}" class="flex-item">
        <button id="button_${name}" class="form-control inlineForProperties" enabled>
            Select Generator
        </button>
    </div>
    `;
    d3.select("#dimension_1").append("div").html(nodeText);

    $("#button_" + name).on("click", function(e){
        $(this).contextMenu();
    });

    $.contextMenu({
        selector: '#button_' + name,
        trigger: 'none',
        callback: function (nameNewGenerator) {
            console.log(nameNewGenerator);
            let generator = new DataGenerator.listOfGens[nameNewGenerator];
            let params = generator.getGenParams();
            params.forEach(param => createWidget(name, param));

            d3.select("#button_" + name).text(nameNewGenerator);
            $("#button_" + name).prop("disabled",true);
            
            dimensions[0].push(generator);
            createNewGenerator("generator_" + ++numGen);
        },
        items: configureMenuOfGens()
    });

    $(".context-menu-item").not(".context-menu-submenu").on("mouseover", function(e){
        try {
            $(this).find("span").attr("title",DataGen.listOfGensHelp[$(this).find("span").text()])
        } catch (e) {
            $(this).find("span").attr("title","There's no tooltip for this yet :(")
        }

    });
}

function createWidget(name, param) {
    // number, array, string, options
    console.log(param);
    d3.select("#" + name).append("div")
        .text("widget aqui")
}

function configureMenuOfGens(){
    let types = ["Sequence", "Random", "Function", "Accessory", "Geometric"];
    let menuObj = {};

    for(let t of types){
        menuObj[t] = {name: t, items: {}};
    }
    let gens = DataGen.listOfGens;
    for(let prop in gens){
        for(let t of types){
            if(gens[prop].prototype instanceof DataGen.superTypes[t]){
                menuObj[t].items[prop] = {};
                menuObj[t].items[prop].name = prop;
                break;
            }
        }
    }
    return menuObj;
}