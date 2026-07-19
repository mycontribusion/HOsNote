const tests = [
  'HOsNote handover — My Team\n[{"w":"ward"}]',
  'Some text {"type":"patients","patients":[{"w":"w1"}]} and more text',
  '[{"w":"ward"}]',
  '{"type":"patients"}',
  'No json here',
  '{"w":"w1"}]'
]

tests.forEach(cleaned => {
        let jsonStr = cleaned
        const firstBracket = jsonStr.indexOf('[')
        const firstBrace = jsonStr.indexOf('{')
        let startIdx = -1
        let isArray = false

        if (firstBracket !== -1 && firstBrace !== -1) {
            if (firstBracket < firstBrace) {
                startIdx = firstBracket
                isArray = true
            } else {
                startIdx = firstBrace
            }
        } else if (firstBracket !== -1) {
            startIdx = firstBracket
            isArray = true
        } else if (firstBrace !== -1) {
            startIdx = firstBrace
        }

        if (startIdx !== -1) {
            const endChar = isArray ? ']' : '}'
            const endIdx = jsonStr.lastIndexOf(endChar)
            if (endIdx !== -1 && endIdx >= startIdx) {
                jsonStr = jsonStr.substring(startIdx, endIdx + 1)
            }
        }

        try {
            const parsed = JSON.parse(jsonStr)
            console.log("Success:", JSON.stringify(parsed))
        } catch (e) {
            console.log("Failed:", cleaned)
        }
})
