// pour simplifier, on va hacher avec md5
const md5 = require('md5');

const MD5_LENGTH = 32;

// miner un bloc, c'est découvrir son nonce : un chiffre qui, "associé au bloc", respecte les contraintes de sécurité
mine = (block) => {
    // on va utiliser un BigInt, car ce nombre peut atteindre des valeurs très grandes
    let nonce = 0n;

    // première étape, calculer le hash du bloc
    const blockHash = md5(block.content);

    // pour le transformer en sa valeur entière (attention, elle est pas petite), un BigInt aussi
    const blockHashValue = BigInt('0x' + blockHash);

    // on va ensuite chercher une valeur qui, ajoutée à la valeur du hash du bloc, donne un hash qui finit par des f
    // le nombre de f à atteindre, c'est le niveau de difficulté
    // en effet, un hash a une chance sur 16 de finir par un f
    // mais seulement une chance sur 256 (16 * 16) de finir par 2 f
    // plus on exige de f, plus la valeur sera longue à trouver (enfin, pas systématiquement*)
    while (md5(blockHashValue + nonce).substring(MD5_LENGTH - block.difficulty) !== 'f'.repeat(block.difficulty)) nonce++;

    // * imaginons un bloc tel que sa valeur de hash + 3 (par exemple) donne quelque chose comme '023854a51d81c56e4fffff'
    // le nonce commence à 0 et est incrémenté de 1, il atteindra vite la valeur 3
    // pour une difficulté inférieure à 6, la découverte de ce nonce sera quasi instantanée :-)
    // mais à partir de 6, il faudra probablement continuer de chercher longtemps
    // => conclusion, + difficile = + plus long à trouver, oui mais pas toujours, dans une grande majorité de cas, disons

    block.nonce = nonce;
};

check = (block) => {
    if (!block.nonce) return false;

    // même procédé que pour le minage, au final
    const blockHash = md5(block.content);

    const blockHashValue = BigInt('0x' + blockHash);

    // sauf qu'on va juste vérifier que le nonce répond bien au niveau de difficulté choisi
    return md5(blockHashValue + block.nonce).substr(MD5_LENGTH - block.difficulty) === 'f'.repeat(block.difficulty);
};

// créons un premier bloc avec un peu de conversation
const block = {
    content: 'Jean:coucou;Simon:hey;Yann:hola', // on peut stocker beaucoup plus de données que ça dans un bloc, hein :-)
    difficulty: 5 // la difficulté (= sécurité) d'un bloc est décidée en fonction de l'importance des données contenues
};

console.time('minage');
mine(block); // si vous avez mis une difficulté supérieure à 6, allez prendre un café, ça va mettre un peu de temps
console.timeEnd('minage');

console.log(`le nonce trouvé vaut ${block.nonce} (difficulté : ${block.difficulty})`);

// vérifions si le bloc est bien valide
if (check(block)) {
    console.log('le bloc est valide');
} else {
    console.log('le bloc n\'est pas valide');
}

// le bloc est valide ! nickel !

// si un utilisateur malicieux tente de faire passer Simon pour un asocial
block.content = 'Jean:coucou;Simon:non;Yann:hola';

// on reteste
if (check(block)) {
    console.log('le bloc modifié est valide');
} else {
    console.log('le bloc modifié n\'est pas valide');
}

// le bloc modifié n'est pas valide ! on ne sait pas ce qui a été modifié, mais on sait qu'on ne peut pas faire confiance à ce qui est écrit dans le bloc

// Appendice A : l'utilité de la difficulté
// "si la moindre modification invalide le bloc, pourquoi s'embêter à calculer un nonce pendant presque 5 secondes ?"
// parce que la sécurité du bloc n'est pas absolue :-) prenez une difficulté de 1 : un md5 est une chaîne hexadécimale
// donc son dernier caractère a une chance sur 16 d'être un f. Une fois modifié, le hash du bloc, un md5 lui aussi,
// a également une chance sur 16 de finir par un f. Ça signifie que pour une difficulté de 1, on ne va pas détecter
// un peu plus de 5% des corruptions de bloc. C'est ÉNORME ! Si ces blocs contiennent des transactions bancaires,
// vous ne voulez pas qu'une modification de votre virement de 15€ à un ami soit modifié en un virement de 15000€...
// À chaque "cran" de difficulté, la sécurité est multipliée par 16, mais le temps nécessaire pour trouver un nonce
// est, lui aussi, multiplié par 16. Il faut donc trouver un juste milieu ;-)

// Appendice B : le chaînage de bloc
// "ok pour le minage, mais après ? qu'est-ce qu'on fait de ce bloc ?"
// une fois qu'un bloc est terminé, on n'y touche plus (forcément, sinon son hash va changer). On en crée un autre
// et on écrit dans celui-là. Ce deuxième bloc va juste inclure le hash du premier. Pourquoi ? Comme ça, pour le fun
// mais surtout pour pouvoir revérifier toute la chaîne, bloc par bloc, et détecter l'endroit où la corruption a eu lieu.