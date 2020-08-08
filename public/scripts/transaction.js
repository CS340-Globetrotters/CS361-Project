/*
transaction.js
Author: George Kochera
Description: Handles the AJAX calls necessary for keeping the checkout basket up to date and populating the available items for the user to select during checkout.
*/

// Get the main elements from the DOM so we can manipulate them later
const productWindow = document.querySelector('#gt_available_products_on_shelf_window')
const basketWindow = document.querySelector('#gt_products_in_basket_window')
const productList = document.querySelector('#gt_available_products_list_group')
const basketTable = document.querySelector('#gt_products_in_basket_table tbody')

// Save the created basket in an array for easy access later
var basket = {}

// Establish the queries necessesary
var availableProductQuery = `SELECT id, name, shelf_quantity, wh_quantity, price FROM products WHERE active = true;`

// Add a listener to populate the page when its done loading
window.addEventListener("load", function() {
    request(availableProductQuery)
})

function request(query) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.open("POST", "/transaction/get_data/", true)
    xmlhttp.setRequestHeader("Content-Type", "application/JSON")

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
               productTableBuilder(JSON.parse(xmlhttp.responseText))
           }
           else if (xmlhttp.status == 400) {
              console.log('There was an error 400');
           }
           else {
               console.log('something else other than 200 was returned');
           }
        }
    };

    xmlhttp.send(JSON.stringify({requestedData: query}));
}

function productTableBuilder(serverResponseInJSON) {
    serverResponseInJSON.forEach(element => {

       // create the row with the product name
       let a = document.createElement("a");
       a.classList.add("list-group-item", "list-group-item-action", "d-flex", "justify-content-between", "align-items-center")
       a.innerText = element.name

       

       // add the badge/pill with the shelf inventory
       if (element.shelf_quantity > 0) {
            let p = document.createElement("span");
            p.classList.add("badge", "badge-primary", "badge-pill");
            p.innerText = element.shelf_quantity
            
            a.addEventListener("click", function() {
                if (element.id in basket){
                    if (basket[element.id]["shelf_quantity"] > 0){
                        basket[element.id]["quantity"] += 1;
                        basket[element.id]["total"] = basket[element.id]["quantity"] * basket[element.id]["unit_price"];
                        thisQuantity = document.querySelector("#gt_" + element.id + "_quantity")
                        thisQuantity.innerText = basket[element.id]["quantity"]
                        thisPrice = document.querySelector("#gt_" + element.id + "_total")
                        thisPrice.innerText = parseMoney(basket[element.id]["total"])
                        basket[element.id]["shelf_quantity"] -= 1;
                        updateTotals()
                    }
                } else {
                item = {id: element.id,
                    name: element.name,
                    unit_price: parseInt(element.price * 100),
                    quantity: 1,
                    total: parseInt(element.price * 100),
                    shelf_quantity: parseInt(element.shelf_quantity - 1)
                }
                let tr = document.createElement("tr")
                let name = document.createElement("th")
                let unit_price = document.createElement("td")
                let qty = document.createElement("td")
                let total = document.createElement("td")
                
                qty.id = "gt_" + element.id + "_quantity"
                total.id = "gt_" + element.id + "_total"
                name.scope = "row"
                name.innerText = element.name
                unit_price.innerText = parseMoney(item.unit_price)
                qty.innerText = 1
                total.innerText = parseMoney(item.total)
    
                tr.appendChild(name)
                tr.appendChild(qty)
                tr.appendChild(unit_price)
                tr.appendChild(total)
                basketTable.appendChild(tr)
                basket[element.id] = item
                updateTotals()
                }
           })

            a.appendChild(p)
       } else {
            let p = document.createElement("span");
            p.classList.add("badge", "badge-danger", "badge-pill");
            a.classList.add("disabled")
            p.innerText = element.wh_quantity
            a.appendChild(p)
       }

       productList.appendChild(a)

    });
}

function updateTotals(){
    let subtotal = document.querySelector("#gt_subtotal")
    let nItems = document.querySelector("#gt_n_items")
    let totalTax = document.querySelector("#gt_total_tax")
    let grandTotal = document.querySelector("#gt_grand_total")

    var subtotalValue = 0
    var nItemsValue = 0
    var totalTaxValue = 0
    var grandTotalValue = 0

    const basketKeys = Object.keys(basket)
    basketKeys.forEach(key => {
        element = basket[key]
        subtotalValue += element.total
        nItemsValue += element.quantity
        totalTaxValue += applyTax(element.total)
        grandTotalValue = subtotalValue + totalTaxValue
    })
    subtotal.innerText = parseMoney(subtotalValue)
    nItems.innerText = nItemsValue
    totalTax.innerText = parseMoney(totalTaxValue)
    grandTotal.innerText = parseMoney(grandTotalValue)
}

function parseMoney(value) {
    var dollars = parseInt(value / 100)
    var cents = parseInt(value % 100)
    if (cents < 10) {
        return '$' + dollars.toString() + '.0' + cents.toString()
    } else {
        return '$' + dollars.toString() + '.' + cents.toString()
    }
}

function applyTax(value) {
    value /= 100
    var taxRate = 0.0635
    var taxedAmount = parseFloat(value) * taxRate
    taxedAmount *= 100
    return parseInt(taxedAmount)
}