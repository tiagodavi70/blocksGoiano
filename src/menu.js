
let dimensions = [];
dimensions.push([]);

function getIndex(str) {
    return + str.split("_")[1]
}

function createNewDimension() {
    
    let dimName = "dimension_" + d3.selectAll(".dimension").nodes().length;
    let sel = d3.select("#main_container")
        .append("div")
            .attr("id", dimName)
            .classed("container", true)
            .classed("dimension", true);

    sel.append("div")
        .text(dimName)
        .style("padding", "5px")
    datagenerator.addColumn(dimName);

    createNewGenerator(dimName);
}

function createNewGenerator(dim_name) {

    let name = "generator_" + d3.selectAll(`.${dim_name}`).nodes().length;
    
    d3.select("#" + dim_name).append("div")
        .classed("flex-item", true)
        .classed("generator", true)
        .style("padding", "3px")
        .attr("id", name)
    .append("button")
        .attr("id", `button_${name}`)
        .classed(dim_name, true)
        .text("Select generator");

    let button_name = `#button_${name}.${dim_name}`; 
    $(button_name).on("click", function(e){
        $(this).contextMenu();
    });

    $.contextMenu({
        selector: button_name,
        trigger: 'none',
        callback: function(nameNewGenerator) {
            d3.select(button_name).text(nameNewGenerator);
            $(button_name).prop("disabled", true);

            let generator = new DataGenerator.listOfGens[nameNewGenerator];
            let params = generator.getGenParams();
            
            datagenerator.addGeneratorToIndex(getIndex(dim_name), generator);
            createNewGenerator(dim_name);
            params.forEach((d, i) => createWidget(name, dim_name, i, generator));
            
            console.log(d3.selectAll(".external-update").nodes());
            if (d3.selectAll(".external-update").nodes().length > 0) {
                console.log("aqui")
                d3.selectAll(".external-update").nodes().forEach( d => {
                    console.log(d);
                    d.dispatchEvent(new Event('change'));
                });   
            }
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

function createWidget(parentName, dimName, paramIndex, generator) {
    
    let params = generator.getGenParams();
    let param = params[paramIndex];
 
    let displayName = param.shortName;
    let shortName = "param_" + paramIndex;

    let parent = d3.select("#" + dimName).select("#" + parentName)
        .append("div")
            // .classed("container", true)
            .classed(parentName, true)
            .text(displayName);
    
    console.log(params);

    switch (param.type) {
        case "number": {
            let value = generator[param.variableName] != 0 ? generator[param.variableName] : 1; // TODO: default value
            let min = -value * 10, max = value * 10, step = value / 100;
            let nodeText = 
            `
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
                datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));
                update();
            })
            break;
        }
        case "string": {
            let value = generator[param.variableName] ? generator[param.variableName] : ""; // TODO: default value
            
            parent.append("input")
                .classed(parentName, true)
                .attr("id", shortName)
                .attr("type", "text")
                .attr("value", value)
                .on("change", function(e,d) {
                    generator[param.variableName] = d3.select(this).node().value;
                    datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));
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
                    datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));
                    update();
                })
            .selectAll("option")
            .data(param.options)
            .join("option")
                .attr("value", d => d)
                .text(d => d);
            break;
        }
        case "array": {
            parent.append("button")
                .classed(parentName, true)
                .attr("id", shortName)
                .text("Add option")
                .on("mousedown", function(e,d) {
                    let hasNumarray = generator.getGenParams().filter( d => d.type == "numarray").length > 0;
                    // let hasNumarray = true;
                    if (generator[param.variableName].length == 3 && generator[param.variableName].filter(
                        (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3) {
                        generator[param.variableName] = [];
                        if (hasNumarray)
                            generator["quantity"] = [];
                        parent.append("div")
                            .classed(parentName, true)
                            .attr("id", shortName)
                    }
                    
                    let element = window.prompt("Input");
                    generator[param.variableName].push(element);
                    datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));
                    
                    parent.select("div").selectAll("div").remove();

                    let probsInputs = parent.select("div").selectAll(".inside-input")
                        .data(generator[param.variableName])
                        .join("div")
                            .classed("container", true)
                            .text(d => d)

                    if (hasNumarray) {
                        generator["quantity"].push(+50); // TODO
                        
                        probsInputs.append("input")
                                .classed("inside-input", true)
                                .attr("type", "range")
                                .attr("min", 0)
                                .attr("max", 100)
                                .attr("step", 1)
                                .attr("value", 50) // TODO: automatic calculation
                                .on("change", function(e,d) {
                                    let n = parent.selectAll("input").nodes();
                                    let index = n.indexOf(this);
                                    let val = d3.select(this).node().value;
                                    
                                    d3.select(this.parentNode).select("div").text(val);

                                    generator["quantity"][index] = +val;
                                    datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));
                                    update();
                                });
                        probsInputs.append("div")
                            .text(50)
                    }
                    update();
                });
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
                        generator[param.variableName] = d3.select(this).node().value;
                        datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));

                        update();
                    });
            break;
        }
        case "auto": {
            d3.select("#" + dimName).select("#" + parentName).append("div")
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
                        datagenerator.columns.filter(d => d.name == selectedDim)[0].generator;
                    datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));
                    update();
                })
            
            function updateOptions() {
                
                let cols = datagenerator.columns.filter(d => d.type == "Numeric" && d.name !== dimName); // column.generator
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
                        datagenerator.columns.filter(d => d.name == selectedDim)[0].generator;
                    datagenerator.changeGeneratorToIndex(getIndex(dimName), generator, getIndex(parentName));
                    update();
                })
            
            function updateOptions() {
                
                let cols = datagenerator.columns.filter(d => d.generator.type == "CategoricalColumn" && d.name !== dimName); // column.generator
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
            d3.select("#" + dimName).select("#" + parentName).append("div")
                .text("widget não mapeado aqui");
            break;
        }
    }

}

function configureMenuOfGens() {
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