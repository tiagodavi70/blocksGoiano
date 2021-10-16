
// from: http://jsfiddle.net/49xy15fq/
function setSliders(attr, onUpdateValue=null){

    let elements = document.querySelectorAll(attr);
    let length = elements.length;
    let sliders = Array.prototype.slice.call(elements); // Copy of `elements` but as a real array
    let max = 1;
    
    function change(current) {
        "use strict";
        
        set(current);
    
        let input = +current.value;
        let delta = max - input;
        let sum = 0;
        let siblings = [];
    
        // Sum of all siblings
        sliders.forEach(function (slider, i) {
            if (current != slider) {
                siblings.push(slider); // Register as sibling
                sum += +slider.value;
            }
        });
    
        // Update all the siblings
        let partial = 0;
        siblings.forEach(function (slider, i) {
             // slider has 100% ratio case
            let val = 0
            if (current.value != current.max) {
                val = +slider.value;
                let fraction = 0;
        
                // Calculate fraction
                if (sum <= 0) {
                    fraction = 1 / (length - 1)
                } else {
                    fraction = val / sum;
                } 
    
                // The last element will correct rounding errors
                if (i >= length - 1) { //i >= length - 1
                    val = max - partial;
                } else {
                    val = delta * fraction;
                    partial += val;
                }
            }

            set(slider, val);
        });
    }
    
    // Set value on a slider
    function set(elm, val) {
        if (val) {
            elm.value = val;
        } else if (val == 0){
            elm.value = val;
        }
        elm.nextSibling.textContent = elm.value
    }
    
    // Add event listeners to the DOM elements
    for (let i = 0, l = elements.length; i < l; i++)  {
        elements[i].addEventListener('input', function (e) {
            change(this);
            if (onUpdateValue) {
                onUpdateValue()
            }
        }, false);
    }
}
