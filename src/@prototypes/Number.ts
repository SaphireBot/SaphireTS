Number.prototype.currency = function (doNotsubstring = true) {
    const numberFormated = Intl.NumberFormat("pt-BR", {
        currency: "BRL",
        style: "currency",
    }).format(<number>this);

    if (doNotsubstring)
        return `${numberFormated.slice(3)}`.slice(0, -3);

    return numberFormated.substring(0, numberFormated.length - 3);
};