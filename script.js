const textarea = document.getElementById("display")
resultado.addEventListener("click", mostrarResultado)

let erro = document.getElementById("erro")

//BÁSICO DE UMA CALCULADORA
function digitar(letra){
    textarea.value += letra
}
function limparTexto(){
    textarea.value = ""
}
function apagar(){
    textarea.value = textarea.value.slice(0,-1)
}

//OPERADORES
function digitParent(parenteses){
    textarea.value += parenteses
}
function digitOper(operador){
    textarea.value += operador
}
function digitarVF(vf){
    textarea.value += vf
}
function digitNeg(negacao){
    textarea.value += negacao
}

//RESULTADO
function mostrarResultado(){
    let expressao = textarea.value
    let tokens = tokenizar(expressao)
    if(!validarExpressao(tokens)){
        erro.innerText = "Expressão inválida"
        return
    }
    let rpn = shuntingYard(tokens)
    let props = pegarProposicoes(tokens)
    let combinacoes = gerarCombinacoes(props)
    let tabela = []

    for(let linha of combinacoes){
        let calc = calcularRPN(rpn, linha)

        tabela.push({
            ...linha,
            ...calc.subResultados
        })
    }

    console.table(tabela)
    mostrarTabelaHTML(tabela)
    let tipo = analisarExpressao(tabela)
    document.getElementById("tabelaVeritati").innerText = "Tabela Verdade"
    document.getElementById("tipoExpress").innerText = "Classificação da expressão: " + tipo
}

//BRINCADEIRAS
function precedencia(op){
    if(op === "~") return 5
    if(op === "∧") return 4
    if(op === "∨") return 3
    if(op === "⊻") return 2
    if(op === "→") return 1
    if(op === "↔") return 0
    return -1
}

function shuntingYard(tokens){
    let output = []
    let stack = []

    for(let token of tokens){
        if(/[A-Z]/.test(token) || token === "[VERDADEIRO]" || token === "[FALSO]"){
            output.push(token)
        }else if(token === "("){
            stack.push(token)
        } else if(token === ")"){
                while(stack.length && stack[stack.length-1] !== "("){
                output.push(stack.pop())
            }

            stack.pop()
        }else{
            while(stack.length && precedencia(stack[stack.length-1]) >= precedencia(token)){
                output.push(stack.pop())
            }
            stack.push(token)
        }
    }
    while(stack.length){
        output.push(stack.pop())
    }

    return output
}

function calcularRPN(expressao, valores){
    let stack = []
    let subResultados = {}

    for(let token of expressao){

        if(/^[A-Z]$/.test(token)){
            stack.push({
                valor: valores[token],
                expr: token
            })
        }else if(token === "[VERDADEIRO]"){
            stack.push({
                valor: true,
                expr: "[VERDADEIRO]"
            })
        }else if(token === "[FALSO]"){
            stack.push({
                valor: false,
                expr: "[FALSO]"
            })
        }else if(token === "~"){
            let a = stack.pop()
            let resultado = !a.valor
            let expr = "~" + a.expr

            stack.push({
                valor: resultado,
                expr: expr
            })

            subResultados[expr] = resultado
        }

        else{
            let b = stack.pop()
            let a = stack.pop()

            let resultado

            if(token === "∧") resultado = a.valor && b.valor
            if(token === "∨") resultado = a.valor || b.valor
            if(token === "⊻") resultado = a.valor !== b.valor
            if(token === "→") resultado = !a.valor || b.valor
            if(token === "↔") resultado = a.valor === b.valor

            let expr = "(" + a.expr + token + b.expr + ")"

            stack.push({
                valor: resultado,
                expr: expr
            })
            subResultados[expr] = resultado
        }
    }
    return {
        resultadoFinal: stack[0].valor,
        subResultados
    }
}

function pegarProposicoes(tokens){
    let props = new Set()

    for(let token of tokens){
        if(/^[A-Z]$/.test(token)){
            props.add(token)
            
        }
    }
    return [...props]
}

function gerarCombinacoes(proposicoes){
    let total = 2 ** proposicoes.length
    let tabela = []

    for(let i = 0; i < total; i++){
        let linha = {}

        for(let j = 0; j < proposicoes.length; j++){
            let valor = Math.floor(i / (2 ** (proposicoes.length - j - 1))) % 2

            linha[proposicoes[j]] = valor === 0 ? true : false
        }
        tabela.push(linha)
    }
    return tabela
}

function gerarTabela(expressao){
    let tokens = tokenizar(expressao)
    let props = pegarProposicoes(tokens)
    let combinacoes = gerarCombinacoes(props)
    let rpn = shuntingYard(tokens)

    for(let linha of combinacoes){
        let resultado = calcularRPN(rpn, linha)

        console.log(linha, "=", resultado)
    }
}

function tokenizar(expressao){

    let regex = /\[VERDADEIRO\]|\[FALSO\]|[A-Z]|[()∧∨⊻→↔~]/g

    return expressao.match(regex) || []

}

function mostrarTabelaHTML(tabela){
    const container = document.getElementById("tabela-container")

    container.innerHTML = ""

    let table = document.createElement("table")
    table.classList.add("tabela-verdade")
    table.border = "1"

    let headers = Object.keys(tabela[0])

    let thead = document.createElement("tr")

    for(let h of headers){
        let th = document.createElement("th")
        th.innerText = h
        thead.appendChild(th)
    }

    table.appendChild(thead)

    for(let linha of tabela){

        let tr = document.createElement("tr")

        for(let h of headers){

            let td = document.createElement("td")
            td.innerText = linha[h] ? "V" : "F"

            tr.appendChild(td)
        }

        table.appendChild(tr)
    }

    container.appendChild(table)

}

function analisarExpressao(tabela){
    let resultados = tabela.map(linha => {
        let array = Object.values(linha);
        return array[array.length-1]});

    let todosVerdadeiros = resultados.every(v => v === true)
    let todosFalsos = resultados.every(v => v === false)

    if(todosVerdadeiros){
        return "Tautologia"
    }

    if(todosFalsos){
        return "Contradição"
    }

    return "Contingência"
}

function validarExpressao(tokens){
    let operadores = ["∧","∨","⊻","→","↔"]
    let anterior = null
    let parenteses = 0

    for(let token of tokens){
        if(token === "("){
            parenteses++
        }if(token === ")"){
            parenteses--
            if(parenteses < 0) return false
        }if(operadores.includes(token) && operadores.includes(anterior)){
            return false
        }if(anterior === null && operadores.includes(token)){
            return false
        }if(operadores.includes(anterior) && token === ")"){
            return false
        }
        anterior = token
    }if(parenteses !== 0){
        return false
    }
    return true
}
