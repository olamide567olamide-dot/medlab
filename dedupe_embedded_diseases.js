const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.join(__dirname, 'disease_diagnosis_app front 3a.html');
const outputPath = path.join(__dirname, 'disease_diagnosis_app_front_3a_deduped.html');
const source = fs.readFileSync(sourcePath, 'utf8');

if (fs.existsSync(outputPath)) {
  throw new Error(`Refusing to overwrite existing output: ${outputPath}`);
}
if (!source.includes('\r\n') || /(^|[^\r])\n/.test(source)) {
  throw new Error('Source does not use consistent CRLF line endings');
}

const assignment = 'const EMBEDDED_DISEASES = ';
const assignmentStart = source.indexOf(assignment);
if (assignmentStart < 0 || source.indexOf(assignment, assignmentStart + assignment.length) >= 0) {
  throw new Error('Expected exactly one EMBEDDED_DISEASES assignment');
}

const jsonStart = assignmentStart + assignment.length;
function scanJsonValue(text, start) {
  let position = start;
  const skipSpace = () => {
    while (/\s/.test(text[position] || '')) position++;
  };
  const scanString = () => {
    const stringStart = position++;
    while (position < text.length) {
      if (text[position] === '\\') {
        position += 2;
      } else if (text[position++] === '"') {
        return { value: JSON.parse(text.slice(stringStart, position)), end: position };
      }
    }
    throw new Error('Unterminated JSON string');
  };
  const parseNode = () => {
    skipSpace();
    const nodeStart = position;
    const token = text[position];
    if (token === '"') {
      const parsed = scanString();
      return { type: 'string', start: nodeStart, end: parsed.end };
    }
    if (token === '{') {
      position++;
      const properties = new Map();
      skipSpace();
      while (text[position] !== '}') {
        skipSpace();
        const key = scanString().value;
        skipSpace();
        if (text[position++] !== ':') throw new Error('Expected colon in JSON object');
        properties.set(key, parseNode());
        skipSpace();
        if (text[position] === '}') break;
        if (text[position++] !== ',') throw new Error('Expected comma in JSON object');
      }
      position++;
      return { type: 'object', start: nodeStart, end: position, properties };
    }
    if (token === '[') {
      position++;
      const items = [];
      skipSpace();
      while (text[position] !== ']') {
        items.push(parseNode());
        skipSpace();
        if (text[position] === ']') break;
        if (text[position++] !== ',') throw new Error('Expected comma in JSON array');
        skipSpace();
      }
      position++;
      return { type: 'array', start: nodeStart, end: position, items };
    }
    while (position < text.length && !/[\s,\]}]/.test(text[position])) position++;
    if (position === nodeStart) throw new Error(`Unexpected JSON token at offset ${position}`);
    return { type: 'value', start: nodeStart, end: position };
  };
  return parseNode();
}

const sourceRootNode = scanJsonValue(source, jsonStart);
const jsonEnd = sourceRootNode.end;
const originalJson = source.slice(jsonStart, jsonEnd);
const parsedData = JSON.parse(originalJson);
const rootNode = scanJsonValue(originalJson, 0);
const firstDiseases = rootNode.properties?.get('diseases');
const firstGroup = firstDiseases?.items?.[0];
const diseaseArrayNode = firstGroup?.properties?.get('diseases');
const diseases = parsedData?.diseases?.[0]?.diseases;
if (diseaseArrayNode?.type !== 'array' || !Array.isArray(diseases) || diseaseArrayNode.items.length !== diseases.length) {
  throw new Error('Unexpected EMBEDDED_DISEASES.diseases[0].diseases structure');
}
if (diseases.length !== 1288) {
  throw new Error(`Expected 1288 entries before deduplication, found ${diseases.length}`);
}

const seen = new Set();
const keptNodes = [];
const removedNames = [];
for (let index = 0; index < diseases.length; index++) {
  const entry = diseases[index];
  if (typeof entry.name !== 'string') throw new Error(`Disease at index ${index} has no string name`);
  const normalizedName = entry.name.trim().toLowerCase();
  if (seen.has(normalizedName)) {
    removedNames.push(entry.name);
  } else {
    seen.add(normalizedName);
    keptNodes.push(diseaseArrayNode.items[index]);
  }
}

const arrayItems = diseaseArrayNode.items;
if (arrayItems.length < 2 || keptNodes.length !== 1143 || removedNames.length !== 145) {
  throw new Error(`Unexpected deduplication result: ${diseases.length} -> ${keptNodes.length}, removed ${removedNames.length}`);
}
const separator = originalJson.slice(arrayItems[0].end, arrayItems[1].start);
if (!/^\s*,\s*$/.test(separator)) throw new Error(`Could not identify the original array-entry separator: ${JSON.stringify(separator)}`);
const retainedText = keptNodes.map(node => originalJson.slice(node.start, node.end)).join(separator);
const arrayPrefix = originalJson.slice(diseaseArrayNode.start, arrayItems[0].start);
const arraySuffix = originalJson.slice(arrayItems[arrayItems.length - 1].end, diseaseArrayNode.end);
const dedupedJson = originalJson.slice(0, diseaseArrayNode.start) + arrayPrefix + retainedText + arraySuffix + originalJson.slice(diseaseArrayNode.end);
const result = source.slice(0, jsonStart) + dedupedJson + source.slice(jsonEnd);

const verifiedData = JSON.parse(dedupedJson);
const verifiedDiseases = verifiedData.diseases[0].diseases;
const verifiedNames = verifiedDiseases.map(entry => entry.name.trim().toLowerCase());
if (verifiedDiseases.length !== 1143 || new Set(verifiedNames).size !== verifiedNames.length) {
  throw new Error('Post-write validation found an incorrect count or duplicate names');
}
if (result.slice(0, jsonStart) !== source.slice(0, jsonStart) || result.slice(jsonStart + dedupedJson.length) !== source.slice(jsonEnd)) {
  throw new Error('Content outside EMBEDDED_DISEASES changed unexpectedly');
}
if (/(^|[^\r])\n/.test(result)) throw new Error('Output no longer uses consistent CRLF line endings');

fs.writeFileSync(outputPath, result, 'utf8');
console.log(`Entries before: ${diseases.length}`);
console.log(`Entries after: ${verifiedDiseases.length}`);
console.log(`Removed names (${removedNames.length}):`);
for (const name of removedNames) console.log(`- ${name}`);
console.log('Duplicate names remaining: 0');
console.log('JSON parse: passed before and after deduplication');
console.log('CRLF line endings: preserved');
console.log('Content outside the embedded JSON: unchanged');
console.log(`Output: ${outputPath}`);
