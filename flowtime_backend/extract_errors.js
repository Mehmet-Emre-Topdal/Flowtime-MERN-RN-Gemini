const fs = require('fs');
const data = JSON.parse(fs.readFileSync('result.json', 'utf8'));
let out = '# Test Sonuçları\n\n';

data.testResults.forEach(res => {
    if (res.status === 'failed') {
        const fileName = res.name.substring(res.name.lastIndexOf('__tests__'));
        out += `## Dosya: ${fileName}\n\n`;
        res.assertionResults.forEach(test => {
            if (test.status === 'failed') {
                out += `### Test: ${test.title}\n`;
                out += `**Hata Mesajı:**\n\`\`\`\n${test.failureMessages[0].substring(0, 500)}\n\`\`\`\n\n`;
            }
        });
    }
});
fs.writeFileSync('C:/Users/devem/.gemini/antigravity/brain/79a58910-b383-431c-9e2a-728da0c069da/test_results.md', out);
