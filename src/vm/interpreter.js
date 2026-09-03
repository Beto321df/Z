const { generate15Junk } = require('../transforms/renameVars');

class VMInterpreterGenerator {
    generate(bytecode, stringTable) {
        const envVar = generate15Junk();
        const bcVar = generate15Junk();
        const pcVar = generate15Junk();

        let strTableSetup = "";
        stringTable.forEach((codes, key) => {
            const decoded = codes.map(c => `string.char(${c - 7})`).join('..');
            strTableSetup += `_E["${key}"] = ${decoded || '""'}\n`;
        });

        return `
local _E = getfenv and getfenv() or _ENV or {}
${strTableSetup}
local ${bcVar} = ${JSON.stringify(bytecode)}
local ${pcVar} = 1
while ${pcVar} <= #${bcVar} do
    local inst = ${bcVar}[${pcVar}]
    if inst[1] == 1 then
        _E[inst[2]] = inst[3]
    elseif inst[1] == 2 then
        local fn = _E[inst[2]] or print
        fn(_E["${Array.from(stringTable.keys())[0] || ''}"])
    end
    ${pcVar} = ${pcVar} + 1
end
        `.trim();
    }
}

module.exports = VMInterpreterGenerator;
