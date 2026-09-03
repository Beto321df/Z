const { generate15Junk } = require('../transforms/renameVars');

class CodeGenerator {
    generate(vmCode) {
        const headerJunk1 = generate15Junk();
        const headerJunk2 = generate15Junk();

        return `--// Z-Protector Custom VM Engine (15-Char Obfuscation)
local _E = getfenv and getfenv() or _ENV or {}
_E["${headerJunk1}"] = "${headerJunk2}"
${vmCode}
`;
    }
}

module.exports = CodeGenerator;
