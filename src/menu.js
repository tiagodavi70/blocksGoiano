
// let dimensions = [];
// dimensions.push([]);

class NullGenerator extends Generator {
    constructor(name){
        super(name);
    }

    generate(v) {
        return undefined;
    }
}

let dimName = "dimension_holder";

function getIndex(str) {
    return + str.split("_")[1]
}

function createNewDimension() {
    
    let dimNameModel = "dimension_" + datagenerator.columns.length;
    
    datagenerator.addColumn(dimNameModel, new NullGenerator("delete-me"));
    
    d3.select("#text_placeholder")
        .text(dimNameModel)
        .style("padding", "5px")
    d3.select("#" + dimName).selectAll("*").remove();
    
    // for (let i = 0 ; i < datagenerator.columns.length; i++) {
    // }
    let style_over = "1px solid firebrick";
    let style_out = "1px solid #ddd"
    let newDim = d3.select("#tab_dimension").append("div")
        // .classed("flex-item", true)
        .classed("tab_dim", true)
        .attr("id", dimNameModel)
        .text(dimNameModel)
        .style("border", style_out)
        .on("mousedown", function(e, d) {
            d3.selectAll(".tab_dim")
                .style("background-color", "#eeeeee")
                .style("border", style_out)
            d3.select(this)
                // .style("background-color", "grey")
                .style("border-bottom", 0)
                .style("background-color","white")
            loadDimension(dimNameModel, false);
        })
    newDim.nodes().forEach( d => {
        d.dispatchEvent(new Event('mousedown'));
    });   
    
    update();
}

function loadDimension(dimNameModel) {
    d3.select("#text_placeholder")
        .text(dimNameModel)
        .style("padding", "5px")
    d3.select("#" + dimName).selectAll("*").remove();

    loadGenerators(dimNameModel, nGen(datagenerator.columns[getIndex(dimNameModel)].generator) < 1);
    update();
}

function loadGenerators(dimIdModel, isFirst=true) {
    
    function loadWidgets(generator) {
        d3.select(button_name).text(generator.name);
        $(button_name).prop("disabled", true);

        let params = generator.getGenParams();
        params.forEach((d, i) => loadWidget(name, dimIdModel, i, generator));
        if (d3.selectAll(".external-update").nodes().length > 0) {
            d3.selectAll(".external-update").nodes().forEach( d => {
                d.dispatchEvent(new Event('change'));
            });   
        }
    }

    let name = "generator_" + d3.selectAll(`.${dimName}`).nodes().length;
    let index = d3.selectAll(`.${dimName}`).nodes().length;

    d3.select("#" + dimName).append("div")
        .classed("generator", true)
        .style("padding", "3px")
        .attr("id", name)
    .append("button")
        .attr("id", `button_${name}`)
        .classed(dimName, true)
        .classed(dimIdModel, true)
        .text("Select generator");

    let button_name = `#button_${name}.${dimIdModel}`;

    $(button_name).on("click", function(e){
        $(this).contextMenu();
    });

    $.contextMenu({
        selector: button_name,
        trigger: 'none',
        callback: function(nameNewGenerator) {
            
            let generator = new DataGenerator.listOfGens[nameNewGenerator];
            if (datagenerator.columns[getIndex(dimIdModel)].generator.name == "delete-me") {
                datagenerator.removeLastGenerator(getIndex(dimIdModel));
                datagenerator.removeColumn(getIndex(dimIdModel));
                datagenerator.addColumn(dimIdModel, generator);
            } else {
                datagenerator.addGeneratorToIndex(getIndex(dimIdModel), generator);
            }
            
            loadWidgets(generator);
            loadGenerators(dimIdModel);
            update();
        },
        items: configureMenuOfGens()
    });

    $(".context-menu-item").not(".context-menu-submenu").on("mouseover", function(e){
        try {
            $(this).find("span").attr("title", DataGen.listOfGensHelp[$(this).find("span").text()])
        } catch (e) {
            $(this).find("span").attr("title", "There's no tooltip for this yet :(")
        }
    });
    
    let g = datagenerator.columns[getIndex(dimIdModel)].generator;
    // console.log(index, nGen(g), g.name, dimIdModel, g.name === "delete-me");
    if (nGen(g) > 0 && !isFirst) {
        // if (index == 0) {
        //     g = g.generator;
        // }
        for (let i = 0 ; i < index; i++) {
            g = g.generator;
        }
        loadWidgets(g);
        loadGenerators(dimIdModel, g.generator === undefined);
    }
}

function nGen(generator) {
    return generator.generator ? nGen(generator.generator) + 1 : (generator.name === "delete-me" ? 0 : 1 );
}

function loadWidget(parentName, dimIdModel, paramIndex, generator) {

    let params = generator.getGenParams();
    let param = params[paramIndex];
 
    let displayName = param.shortName;
    let shortName = "param_" + paramIndex;

    let parent = d3.select("#" + dimName).select("#" + parentName)
        .append("div")
            // .classed("container", true)
            .classed(parentName, true)
            .text(displayName);
            
    switch (param.type) {
        case "number": {
            let value = generator[param.variableName] != 0 ? +generator[param.variableName] : 1; // TODO: default value
            let min = -value * 10, max = value * 10, step = value / 100;
            let nodeText = `
                <label for="${shortName}" style="border: 1px solid grey; margin: 5px" class="flex-container container">
                    <div style="margin: 5px"> ${displayName} </div>
                    <input class="${parentName}" id="${shortName}" type="range" min="${min}" max="${max}"
                            step="${step}" value="${value}">
                    <div class="${parentName}_display" id="${displayName}_value" style="margin: 0.3em;"> ${value} </div>
                </label>
            `;

            parent.html(nodeText);

            d3.select(`input#${shortName}.${parentName}`).on("change", function(d,e) {
                let val = d3.select(this).node().value;
                d3.select(`div#${displayName}_value.${parentName}_display`).text(val);
                
                generator[param.variableName] = +val;
                datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName) );
                update();
            })
            break;
        }
        case "string": {
            let value = generator[param.variableName] || ""; // TODO: default value
            
            parent.append("input")
                .classed(parentName, true)
                .attr("id", shortName)
                .attr("type", "text")
                .attr("value", value)
                .on("change", function(e,d) {
                    generator[param.variableName] = d3.select(this).node().value;
                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                    update();
                })
            break;
        }
        case "options": {
            parent.append("select")
                .classed(parentName, true)
                .attr("id", shortName)
                .on("change", function(e,d) {
                    generator[param.variableName] = d3.select(this).node().value;
                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                    update();
                })
            .selectAll("option")
            .data(param.options)
            .join("option")
                .attr("value", d => d)
                .text(d => d)
                .property("selected", d => d == generator[param.variableName]);
            break;
        }
        case "array": {
            
            let hasNumarray = generator.getGenParams().filter( d => d.type == "numarray").length > 0;
            parent.append("button")
                .classed(parentName, true)
                .attr("id", shortName)
                .text("Add option")
                .on("mousedown", function(e,d) {
                    //console.log(generator[param.variableName]);

                    if (generator[param.variableName].length == 3 && generator[param.variableName].filter(
                        (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3) {
                        generator[param.variableName] = [];
                        if (hasNumarray) {
                            generator["quantity"] = [];
                        }
                    }
                    
                    let element = window.prompt("Input");
                    generator[param.variableName].push(element);
                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                    
                    parent.select("div").selectAll("div").remove();
                    
                    loadCategories();
                    update();
                });
            parent.append("div")
                .classed(parentName, true)
                .attr("id", shortName)
            
            if (!(generator[param.variableName].length == 3 && generator[param.variableName].filter(
                (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3)) {
                    loadCategories()
            }

            function loadCategories() {
                
                let probsInputs = parent.select("div").selectAll(".inside-input")
                    .data(generator[param.variableName])
                    .join("div")
                        .classed("container", true)
                        .text(d => d)
                        
                if (hasNumarray) {
                    let v = (d,i) => generator["quantity"][i] ? 
                            generator["quantity"][i] : 50; // use the number_lines / length
                    probsInputs.append("input")
                            .classed("inside-input", true)
                            .attr("type", "range")
                            .attr("min", 0)
                            .attr("max", 100)
                            .attr("step", 1)
                            .attr("value", v) // TODO: automatic calculation
                            .on("change", function(e,d) {
                                let n = parent.selectAll("input").nodes();
                                let index = n.indexOf(this);
                                let val = d3.select(this).node().value;
                                
                                d3.select(this.parentNode).select("div").text(val);

                                generator["quantity"][index] = +val;
                                datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                                update();
                            });
                    probsInputs.append("div")
                        .text(v)
                }
                
            }
            break;
        }
        case "boolean": {
            let textNode = `<input type="checkbox" id="${shortName}" name="${shortName}">
                            <label for="${shortName}">${displayName}</label>`;
            parent.append("div")
                    .classed("container", true)
                    .html(textNode)
                .select("input")
                    .on("change", function(e,d) {
                        generator[param.variableName] = d3.select(this).node().value == "true";
                        datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));

                        update();
                    })
                    .property("selected", generator[param.variableName]); //generator[param.variableName]
            break;
        }
        case "auto": {
            d3.select("#" + dimIdModel).select("#" + parentName).append("div")
                .text(param.variableName + ": " + generator[param.variableName]);
            break;
        }
        case "NumericColumn": {
            
            let options = parent.append("select")
                .classed(parentName, true)
                .classed("external-update", true)
                .attr("id", shortName)
                .on("change", function(e,d) {
                    updateOptions();
                    let selectedDim = d3.select(this).node().value;
                    generator[param.variableName] = 
                        datagenerator.columns[datagenerator.columns.map(d => d.name).indexOf(selectedDim)].generator;
                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                    update();
                });
            
            function updateOptions() {
                
                let cols = datagenerator.columns.filter(d => d.type == "Numeric" 
                                                        && d.name !== dimIdModel); // column.generator
                let names = cols.map((d,i) => d.name);

                options.selectAll("option")
                    .data(names)
                    .join("option")
                        .attr("value", d => d)
                        .text(d => d);
            }

            updateOptions();
            break;
        }
        case "CategoricalColumn": {
            
            let options = parent.append("select")
                .classed(parentName, true)
                .classed("external-update", true)
                .attr("id", shortName)
                .on("change", function(e,d) {
                    updateOptions();
                    let selectedDim = d3.select(this).node().value;
                    generator[param.variableName] = 
                        datagenerator.columns[datagenerator.columns.map(d => d.name).indexOf(selectedDim)].generator;
                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                    update();
                })
            
            function updateOptions() {
                
                let cols = datagenerator.columns.filter(d => d.type == "Categorical" 
                                                            && d.name !== dimIdModel); // column.generator
                let names = cols.map((d,i) => d.name);

                options.selectAll("option")
                    .data(names)
                    .join("option")
                        .attr("value", d => d)
                        .text(d => d);
            }

            updateOptions();
            break;
        }
        case "numarray": {
            console.log(param)
            break;
        }
        default: {
            console.log(param); // não apagar, importante debug
            d3.select("#" + dimIdModel).select("#" + parentName).append("div")
                .text("widget não mapeado aqui");
            break;
        }
    }

}

function configureMenuOfGens() {
    let types = ["Sequence", "Random", "_Function", "Accessory", "Geometric"];
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