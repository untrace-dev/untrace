'use client';

import { CodeComparison } from '@untrace/ui/magicui/code-comparison';
import { ScriptCopyBtn } from '@untrace/ui/magicui/script-copy-btn';
import { motion } from 'motion/react';

const beforeCode = `// Without Untrace - flying blind 🙈
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
});

// ❌ No visibility into:
// - Only one LLM Observability tool
// - Token usage & costs
// - Response latency
// - Error rates
// - Model performance`;

const afterCode = `// With Untrace - full observability 🔍
import { init } from '@untrace/sdk';

init({ apiKey: 'your-api-key' }); // One line setup!

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
});

// ✅ Automatic tracking of: // [!code highlight]
// - Token usage & costs ($0.03) // [!code highlight]
// - Response latency (1.2s) // [!code highlight]
// - Success/error rates // [!code highlight]
// - Complete traces // [!code highlight]`;

export function HeroCodeSection() {
  return (
    <div className="w-full relative px-2 lg:px-24 mt-16 mb-10">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        {/* Installation section */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">Get started in seconds</h3>
            <p className="text-muted-foreground">
              Works with OpenAI, Anthropic, LangChain, and 30+ providers
            </p>
          </div>
          <div className="flex justify-center">
            <ScriptCopyBtn
              className="max-w-md"
              codeLanguage="bash"
              commandMap={{
                bun: 'bun add @untrace/sdk',
                npm: 'npm install @untrace/sdk',
                pip: 'pip install @untrace/sdk',
                pnpm: 'pnpm add @untrace/sdk',
                uv: 'uv add @untrace/sdk',
                yarn: 'yarn add @untrace/sdk',
              }}
              darkTheme="github-dark"
              lightTheme="github-light"
            />
          </div>
        </motion.div>

        {/* Code comparison section */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">
              Instrument once, observe everywhere
            </h3>
            <p className="text-muted-foreground">
              Zero-latency observability that just works
            </p>
          </div>
          <CodeComparison
            afterCode={afterCode}
            beforeCode={beforeCode}
            darkTheme="github-dark"
            filename="your-app.ts"
            highlightColor="rgba(101, 117, 133, 0.16)"
            language="typescript"
            lightTheme="github-light"
          />
        </motion.div>

        {/* Features highlights */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div
            className="text-center space-y-3 p-6 rounded-lg bg-muted/30 border border-border"
            transition={{ stiffness: 300, type: 'spring' }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-5xl font-bold bg-gradient-to-br from-secondary to-secondary/60 bg-clip-text text-transparent">
              0ms
            </div>
            <div className="text-sm font-medium">Latency overhead</div>
            <div className="text-xs text-muted-foreground">
              Async, non-blocking design
            </div>
          </motion.div>
          <motion.div
            className="text-center space-y-3 p-6 rounded-lg bg-muted/30 border border-border"
            transition={{ stiffness: 300, type: 'spring' }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-5xl font-bold bg-gradient-to-br from-secondary to-secondary/60 bg-clip-text text-transparent">
              30+
            </div>
            <div className="text-sm font-medium">Providers supported</div>
            <div className="text-xs text-muted-foreground">
              All major LLMs & frameworks
            </div>
          </motion.div>
          <motion.div
            className="text-center space-y-3 p-6 rounded-lg bg-muted/30 border border-border"
            transition={{ stiffness: 300, type: 'spring' }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-5xl font-bold bg-gradient-to-br from-secondary to-secondary/60 bg-clip-text text-transparent">
              100%
            </div>
            <div className="text-sm font-medium">OpenTelemetry</div>
            <div className="text-xs text-muted-foreground">
              Industry standard traces
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
