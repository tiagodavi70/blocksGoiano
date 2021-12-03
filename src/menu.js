
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
    let splited = str.split("_"); 
    if (splited.length == 2) {
        return +splited[1];
    }
    else {
        return datagenerator.columns.map(d => d.name).indexOf(str);
    }
}

function getColFromName(name) {
    return datagenerator.columns[datagenerator.columns.map(d => d.name).indexOf(name)];
}

function createNewDimension(aux=undefined, auxIndex=0) {
     
    let dimNameModel = aux ? "aux_" + getIndex(aux) + "_" + auxIndex :
                             "dimension_" + datagenerator.columns.length;
    
    datagenerator.addColumn(dimNameModel, new NullGenerator("delete-me"));
    
    // auxiliar columns do not generate any data in any case
    if (aux) {
        datagenerator.columns[datagenerator.columns.length-1].display = false;
    } else {
        d3.select("#text_placeholder")
            .text(dimNameModel)
            .style("padding", "5px")
        d3.select("#" + dimName).selectAll("*").remove();
    }
    
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
            loadDimension(dimNameModel);
        })  
    
    if (!aux) {
        newDim.nodes().forEach( d => {
            d.dispatchEvent(new Event('mousedown'));
        }); 
        update();
    } else {
        newDim.style("background", "#bbb")
    }
    d3.select("#overview_stats").append("div")
        .classed("container", true)
        .attr("id", "overview_" + dimNameModel)
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

    d3.select("#" + dimName).append("div").lower()
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
    
    if (nGen(g) > 0 && !isFirst) {
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
            .classed(parentName, true)
            .text(displayName);

    switch (param.type) {
        case "number": {
            let value = generator[param.variableName] != undefined ? +generator[param.variableName] : 1; // TODO: default value
            let slider_value = value == 0 ? 1 : value;

            let min = -100;
            let max = 100;
            let step = 1;

            let missing = ["MCAR", "MNAR"].includes(generator.name);
            let isFunction = generator.name.includes("Function");

            if (isFunction || generator.name == "Noise Generator") {
                min = -10;
                max = 10;
                step = 0.1;
            } else if (missing) {
                min = 0;
                max = 1;
                step = 0.01;
            }

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
                
                // TODO: CONTINUAR DAQUI
                // if (generator.name == "Range Filter") {
                //     console.log(parent.node())
                //     return;
                // } 

                d3.select(`div#${displayName}_value.${parentName}_display`).text(val);
                generator[param.variableName] = +val;
                datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName) );
                update();
            })
            break;
        }
        case "string": {
            let value = generator[param.variableName] || "";
            
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
            if (generator[param.variableName].length == 3 && generator[param.variableName].filter(
                (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3) {
                generator[param.variableName] = [];
            }
            
            let probsVar = generator.name == "Weighted Categorical" ? "weights" : "quantity";
            let hasNumarray = generator.getGenParams().filter( d => d.type == "numarray").length > 0;
            parent.append("button")
                .classed(parentName, true)
                .attr("id", shortName)
                .text("Add option")
                .on("mousedown", function(e,d) {
                    
                    if (generator[param.variableName].length == 3 && generator[param.variableName].filter(
                        (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3) {
                        generator[param.variableName] = [];
                        if (hasNumarray) {
                            generator[probsVar] = [];
                        }
                    }
                    
                    let element = window.prompt("Input");
                    generator[param.variableName].push(element);
                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                    parent.select("div").selectAll("div").remove();
                    if (hasNumarray) {
                        generator[probsVar].push(probsVar == "weights" ? 1 : 50);
                    }
                    loadCategories();
                    update();
                });
            parent.append("div")
                .classed(parentName, true)
                .attr("id", shortName)
            
            if (!(generator[param.variableName].length == 3 && generator[param.variableName].filter(
                (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3)) {
                    loadCategories();
            }

            function loadCategories() {
                    
                let probsInputs = parent.select("div").selectAll(".inside-input")
                    .data(generator[param.variableName])
                    .join("div")
                        .classed("container", true)
                        .text(d => d)

                // adding a new node must reset all values                
                if (hasNumarray) {
                    let newElement = d3.sum(generator[probsVar]) > 1;
                    let ratio = generator.name == "Weighted Categorical" ? 1 / generator[probsVar].length : 50;
                    if (newElement) {
                        for (let i = 0 ; i < generator[probsVar].length ; i++) {
                            generator[probsVar][i] = ratio;
                        }
                    }
                    
                    let v = (d,i) => (generator[probsVar][i] && !newElement ? 
                            generator[probsVar][i] : ratio).toFixed(2);
                    
                    let classSlider = `dim_${getIndex(dimIdModel)}_gen_${getIndex(parentName)}`; 
                    probsInputs.append("input")
                            .classed("inside-input", true)
                            .classed(classSlider, true)
                            .attr("id", (d,i) => "slider_" + i)
                            .attr("type", "range")
                            .attr("min", 0)
                            .attr("max", 1)
                            .attr("step", .01)
                            .attr("value", (v)) // TODO: automatic calculation
                            .on("change", function(e,d) {
                                let n = parent.selectAll("input").nodes();
                                let index = n.indexOf(this);
                                let val = d3.select(this).node().value;
                                
                                d3.select(this.parentNode).select("div").text(val);
                                generator[probsVar][index] = +val;

                                datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                                update();
                            })
                            
                    probsInputs.append("div").text(v);

                    setSliders("." + classSlider, () => {
                        let values = Array.from(document.querySelectorAll("." + classSlider));
                        
                        if (values.length > 0) {
                            generator[probsVar] = values.map(d => +d.value);
                            datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                            update();
                        }                      
                    });
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
        case "CategoricalColumn": { // vvv

            let options = parent.append("select")
                .classed(parentName, true)
                .classed("external-update", true)
                .attr("id", shortName)
                .on("change", function(e,d) {
                    updateOptions();
                    let selectedDim = d3.select(this).node().value;
                    if (!selectedDim) {
                        return;
                    }

                    let selectedGen = getColFromName(selectedDim).generator;
                    generator[param.variableName] = selectedGen;
                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));

                    if (generator.name == "Categorical Function") {
                        let id = `${shortName}_${getIndex(dimIdModel)}_${getIndex(parentName)}`;
                        parent.select("#"+id).remove();

                        let catArea = parent.append("div")
                            .attr("id", id)
                            .text("Categories")
                        generator.reset();

                        generator.inputGenIndex = selectedGen.order;
                        generator.selectedInterface = {};

                        if (Object.keys(generator).indexOf("inputGenerator") >= 0) {
                            if (Object.keys(generator.listOfGenerators).length == 0) {
                                
                                selectedGen.array.forEach((d, i)=> {
                                    createNewDimension(dimIdModel, i);
                                    let auxName = "aux_" + getIndex(dimIdModel) + "_" + i;
                                    let col = getColFromName(auxName);
                                    generator.listOfGenerators[d] = col.generator;
                                })

                            } else {
                                let sizeInput = Object.keys(generator.listOfGenerators).length;
                                let sizeSelected = selectedGen.array.length;
                                
                                if (sizeInput > sizeSelected) {
                                    for (let i = sizeSelected ; i < sizeInput ; i++ ) {
                                        createNewDimension(dimIdModel, i);
                                        let auxName = "aux_" + getIndex(dimIdModel) + "_" + i;
                                        let col = getColFromName(auxName);
                                        generator.listOfGenerators[d] = col.generator;
                                    }
                                } 
                            }
                        }

                        for (let i = 0 ; i < selectedGen.array.length ; i++) {
                            let cat = selectedGen.array[i];
                            let auxName = "aux_" + getIndex(dimIdModel) + "_" + i;
                            
                            let tempArea = catArea.append("div")
                                .classed("container", true)
                                .style("margin", "5px");
                            tempArea.append("div")
                                .text(cat)
                                .style("margin-right", "5px")
                            let optionsCat = tempArea.append("select")
                                .classed("external-update", true)
                                .on("change", function(e,d) {
                                    let selectedAux = d3.select(this).node().value;
                                    generator.selectedInterface[cat] = selectedAux;
                                    generator.listOfGenerators[cat] = getColFromName(selectedAux).generator;
                                    datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));
                                })    
                            updateCategoricalColumn(optionsCat);
                            generator.selectedInterface[cat] = auxName;
                            optionsCat.property("value", auxName);   
                        }
                        datagenerator.changeGeneratorToIndex(getIndex(dimIdModel), generator, getIndex(parentName));

                    } else {
                        update();
                    }
                })
            
            function updateCategoricalColumn(optionsCategorical) {
                let cols = datagenerator.columns.filter(d => d.type == "Numeric" && d.name.includes("aux"));
                
                let names = cols.map((d,i) => d.name);

                optionsCategorical.selectAll("option")
                    .data(names)
                    .join("option")
                        .attr("value", d => d)
                        .text(d => d);
            }

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
            console.log("numarray param")
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