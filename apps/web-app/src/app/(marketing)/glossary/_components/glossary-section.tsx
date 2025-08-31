'use client';

import { MetricButton } from '@untrace/analytics/components';
import { Badge } from '@untrace/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { H1, H2, P } from '@untrace/ui/custom/typography';
import { Input } from '@untrace/ui/input';
import { MagicCard } from '@untrace/ui/magicui/magic-card';
import { Search, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const aiTerms = {
  // Additional important terms for comprehensive coverage
  '1': [
    {
      description:
        "1-shot learning is a form of few-shot learning where AI models learn new tasks with just one example, demonstrating the model's ability to generalize from minimal data.",
      term: '1-Shot Learning',
      tlDr: 'AI models learning new tasks with just one example.',
    },
  ],
  '2': [
    {
      description:
        '2-shot learning allows AI models to learn new tasks with exactly two examples, providing slightly more context than 1-shot learning while still being extremely data-efficient.',
      term: '2-Shot Learning',
      tlDr: 'AI models learning new tasks with exactly two examples.',
    },
  ],
  '3': [
    {
      description:
        '3-shot learning provides AI models with three examples to learn new tasks, offering a balance between data efficiency and learning effectiveness.',
      term: '3-Shot Learning',
      tlDr: 'AI models learning new tasks with three examples.',
    },
  ],
  A: [
    {
      description:
        'A/B testing in AI systems involves comparing two different model versions, prompts, or configurations to determine which performs better based on specific metrics and user feedback.',
      term: 'A/B Testing',
      tlDr: 'Comparing two AI model versions to determine which performs better.',
    },
    {
      description:
        'Active learning is a machine learning technique where the model identifies the most informative data points for labeling, reducing the amount of labeled data needed for training.',
      term: 'Active Learning',
      tlDr: 'AI model identifies most valuable data points for human labeling to improve efficiency.',
    },
    {
      description:
        'Adversarial training involves training AI models with intentionally crafted examples designed to fool the model, improving robustness and reducing vulnerability to attacks.',
      term: 'Adversarial Training',
      tlDr: 'Training AI models with intentionally misleading examples to improve robustness.',
    },
    {
      description:
        'Attention mechanisms allow AI models to focus on specific parts of input data, enabling better understanding of context and relationships between different elements.',
      term: 'Attention Mechanism',
      tlDr: 'AI model technique that focuses on relevant parts of input data for better understanding.',
    },
  ],
  B: [
    {
      description:
        'Batch processing in AI involves processing multiple data samples together, improving computational efficiency and enabling parallel processing on GPUs and TPUs.',
      term: 'Batch Processing',
      tlDr: 'Processing multiple AI training examples together for improved efficiency.',
    },
    {
      description:
        'Bias in AI refers to systematic errors or prejudices in model predictions, often reflecting historical data patterns or training data imbalances that can lead to unfair outcomes.',
      term: 'Bias',
      tlDr: 'Systematic errors in AI predictions that can lead to unfair or incorrect outcomes.',
    },
    {
      description:
        'Backpropagation is the core algorithm for training neural networks, calculating gradients to update model weights and minimize prediction errors.',
      term: 'Backpropagation',
      tlDr: 'Core algorithm for training neural networks by calculating and applying gradients.',
    },
  ],
  C: [
    {
      description:
        'Chain-of-thought prompting encourages AI models to show their reasoning process step-by-step, improving accuracy and making outputs more interpretable and trustworthy.',
      term: 'Chain-of-Thought',
      tlDr: 'AI prompting technique that shows step-by-step reasoning for better accuracy.',
    },
    {
      description:
        'Context length refers to the maximum amount of text or tokens an AI model can process in a single input, affecting how much information the model can consider at once.',
      term: 'Context Length',
      tlDr: 'Maximum amount of text an AI model can process in a single input.',
    },
    {
      description:
        'Cost optimization in AI involves balancing model performance with computational resources, including strategies for reducing inference time, memory usage, and API costs.',
      term: 'Cost Optimization',
      tlDr: 'Balancing AI model performance with computational resources and costs.',
    },
    {
      description:
        'Cross-validation is a technique for assessing AI model performance by training on multiple data subsets, ensuring reliable performance estimates across different data distributions.',
      term: 'Cross-Validation',
      tlDr: 'Technique to assess AI model performance across multiple data subsets.',
    },
  ],
  D: [
    {
      description:
        'Data drift occurs when the statistical properties of input data change over time, potentially degrading AI model performance and requiring retraining or adaptation.',
      term: 'Data Drift',
      tlDr: 'Changes in input data statistics that can degrade AI model performance.',
    },
    {
      description:
        'Distillation involves training a smaller, faster model to mimic the behavior of a larger, more complex model, enabling deployment in resource-constrained environments.',
      term: 'Distillation',
      tlDr: 'Training smaller models to mimic larger ones for efficient deployment.',
    },
    {
      description:
        'Domain adaptation techniques help AI models perform well on new, related domains by leveraging knowledge from source domains while adapting to target domain characteristics.',
      term: 'Domain Adaptation',
      tlDr: 'Techniques to adapt AI models for new domains using source domain knowledge.',
    },
  ],
  E: [
    {
      description:
        'Embeddings are numerical representations of text, images, or other data that capture semantic meaning, enabling AI models to understand relationships and similarities.',
      term: 'Embeddings',
      tlDr: 'Numerical representations that capture semantic meaning of data for AI models.',
    },
    {
      description:
        'Evaluation metrics measure AI model performance using specific criteria like accuracy, precision, recall, F1-score, or custom business metrics relevant to the use case.',
      term: 'Evaluation Metrics',
      tlDr: 'Specific criteria used to measure and compare AI model performance.',
    },
    {
      description:
        'Explainable AI (XAI) refers to techniques that make AI model decisions interpretable and understandable to humans, building trust and enabling better decision-making.',
      term: 'Explainable AI',
      tlDr: 'Techniques to make AI model decisions interpretable and understandable.',
    },
  ],
  F: [
    {
      description:
        'Few-shot learning enables AI models to learn new tasks with minimal examples, leveraging pre-trained knowledge to adapt quickly to new domains or requirements.',
      term: 'Few-Shot Learning',
      tlDr: 'AI models learning new tasks with minimal training examples.',
    },
    {
      description:
        'Fine-tuning involves adapting pre-trained AI models to specific tasks or domains by training on task-specific data, improving performance while requiring less data than training from scratch.',
      term: 'Fine-Tuning',
      tlDr: 'Adapting pre-trained AI models to specific tasks using targeted data.',
    },
    {
      description:
        'Feature engineering is the process of creating, selecting, or transforming input variables to improve AI model performance and interpretability.',
      term: 'Feature Engineering',
      tlDr: 'Creating and transforming input variables to improve AI model performance.',
    },
  ],
  G: [
    {
      description:
        'Ground truth refers to the correct or expected answers used to train and evaluate AI models, typically provided by human experts or authoritative sources.',
      term: 'Ground Truth',
      tlDr: 'Correct answers used to train and evaluate AI models.',
    },
    {
      description:
        'Gradient descent is the optimization algorithm used to train neural networks, iteratively adjusting model weights to minimize prediction errors.',
      term: 'Gradient Descent',
      tlDr: 'Optimization algorithm that adjusts neural network weights to minimize errors.',
    },
  ],
  H: [
    {
      description:
        'Hallucination in AI refers to when models generate false or fabricated information that appears plausible but is not based on actual training data or facts.',
      term: 'Hallucination',
      tlDr: 'AI models generating false information that appears plausible but is incorrect.',
    },
    {
      description:
        'Hyperparameter tuning involves optimizing AI model configuration settings like learning rates, batch sizes, and architecture choices to achieve optimal performance.',
      term: 'Hyperparameter Tuning',
      tlDr: 'Optimizing AI model configuration settings for best performance.',
    },
  ],
  I: [
    {
      description:
        'In-context learning allows AI models to learn new tasks by providing examples within the input prompt, enabling adaptation without retraining.',
      term: 'In-Context Learning',
      tlDr: 'AI models learning new tasks through examples in input prompts.',
    },
    {
      description:
        'Inference is the process of using a trained AI model to make predictions on new data, typically much faster than training but requiring the model to be already trained.',
      term: 'Inference',
      tlDr: 'Using trained AI models to make predictions on new data.',
    },
    {
      description:
        'Iterative refinement involves repeatedly improving AI model outputs through feedback loops, often using human feedback to guide model improvements.',
      term: 'Iterative Refinement',
      tlDr: 'Repeatedly improving AI model outputs through feedback loops.',
    },
  ],
  J: [
    {
      description:
        'Joint training involves training multiple AI models or components together, allowing them to learn complementary representations and improve overall system performance.',
      term: 'Joint Training',
      tlDr: 'Training multiple AI models together for complementary learning.',
    },
  ],
  L: [
    {
      description:
        'Large Language Models (LLMs) are AI models trained on vast amounts of text data, capable of understanding and generating human-like text across many domains.',
      term: 'Large Language Models',
      tlDr: 'AI models trained on vast text data for understanding and generating text.',
    },
    {
      description:
        'Learning rate controls how quickly AI models update their weights during training, affecting convergence speed and final model performance.',
      term: 'Learning Rate',
      tlDr: 'Controls how quickly AI models update weights during training.',
    },
    {
      description:
        'Logging in AI systems captures detailed information about model inputs, outputs, decisions, and performance metrics for monitoring, debugging, and improvement.',
      term: 'Logging',
      tlDr: 'Recording AI model inputs, outputs, and performance for monitoring.',
    },
    {
      description:
        'LLM trace refers to the detailed tracking and recording of all interactions with large language models, including inputs, outputs, prompts, and metadata for debugging and optimization.',
      term: 'LLM Trace',
      tlDr: 'Detailed tracking of all LLM interactions for debugging and optimization.',
    },
    {
      description:
        'Latency in AI systems measures the time between sending a request to a model and receiving a response, critical for user experience and real-time applications.',
      term: 'Latency',
      tlDr: 'Time between AI model request and response, critical for user experience.',
    },
  ],
  M: [
    {
      description:
        'Model monitoring involves tracking AI model performance, behavior, and health in production, detecting issues like drift, degradation, or unexpected behavior.',
      term: 'Model Monitoring',
      tlDr: 'Tracking AI model performance and behavior in production environments.',
    },
    {
      description:
        'Multi-modal AI refers to models that can process and understand multiple types of data (text, images, audio, video) simultaneously.',
      term: 'Multi-Modal AI',
      tlDr: 'AI models that process multiple data types simultaneously.',
    },
    {
      description:
        'Model serving involves deploying trained AI models to production environments where they can receive requests and return predictions in real-time.',
      term: 'Model Serving',
      tlDr: 'Deploying trained AI models for real-time prediction serving.',
    },
  ],
  N: [
    {
      description:
        'Neural networks are computational models inspired by biological brains, consisting of interconnected nodes that process information and learn patterns from data.',
      term: 'Neural Networks',
      tlDr: 'Computational models with interconnected nodes that learn from data.',
    },
    {
      description:
        'Natural Language Processing (NLP) is a field of AI focused on enabling computers to understand, interpret, and generate human language.',
      term: 'NLP',
      tlDr: 'AI field focused on understanding and generating human language.',
    },
  ],
  O: [
    {
      description:
        'Observability in AI systems provides visibility into model behavior, performance, and decision-making processes, enabling debugging, optimization, and trust building.',
      term: 'Observability',
      tlDr: 'Visibility into AI model behavior, performance, and decision-making.',
    },
    {
      description:
        'Overfitting occurs when AI models learn training data too well, including noise and irrelevant patterns, leading to poor performance on new, unseen data.',
      term: 'Overfitting',
      tlDr: 'AI models learning training data too well, including noise and irrelevant patterns.',
    },
    {
      description:
        'Online learning allows AI models to continuously update and improve as new data becomes available, adapting to changing patterns and requirements.',
      term: 'Online Learning',
      tlDr: 'AI models continuously updating as new data becomes available.',
    },
    {
      description:
        'OpenAI API is a popular platform for accessing large language models, providing developers with tools to integrate AI capabilities into applications.',
      term: 'OpenAI API',
      tlDr: 'Popular platform for accessing large language models and AI capabilities.',
    },
    {
      description:
        'Output validation ensures AI model responses meet quality standards, including checks for accuracy, relevance, safety, and adherence to guidelines.',
      term: 'Output Validation',
      tlDr: 'Ensuring AI model responses meet quality and safety standards.',
    },
  ],
  P: [
    {
      description:
        'Prompt engineering involves designing and optimizing input prompts to get desired outputs from AI models, including techniques like few-shot learning and chain-of-thought.',
      term: 'Prompt Engineering',
      tlDr: 'Designing and optimizing input prompts for desired AI model outputs.',
    },
    {
      description:
        'Product analytics in AI involves tracking user interactions, model performance, and business metrics to understand how AI systems impact user experience and business outcomes.',
      term: 'Product Analytics',
      tlDr: 'Tracking AI system performance and user interactions for business insights.',
    },
    {
      description:
        'Pre-training involves training AI models on large, general datasets before fine-tuning on specific tasks, enabling transfer learning and improved performance.',
      term: 'Pre-Training',
      tlDr: 'Training AI models on general data before task-specific fine-tuning.',
    },
    {
      description:
        'Performance metrics in AI track key indicators like accuracy, response time, throughput, and user satisfaction to measure system effectiveness and identify improvement areas.',
      term: 'Performance Metrics',
      tlDr: 'Key indicators measuring AI system effectiveness and user satisfaction.',
    },
    {
      description:
        'Prompt templates are reusable, structured formats for AI model inputs that ensure consistency, reduce errors, and improve output quality across different use cases.',
      term: 'Prompt Templates',
      tlDr: 'Reusable, structured formats for consistent AI model inputs.',
    },
  ],
  Q: [
    {
      description:
        'Quantization reduces AI model size and improves inference speed by representing weights and activations with fewer bits, often with minimal accuracy loss.',
      term: 'Quantization',
      tlDr: 'Reducing AI model size by using fewer bits for weights and activations.',
    },
    {
      description:
        'Quality assurance in AI involves systematic testing, validation, and monitoring to ensure models meet performance, safety, and reliability requirements.',
      term: 'Quality Assurance',
      tlDr: 'Systematic testing and validation to ensure AI model quality.',
    },
  ],
  R: [
    {
      description:
        'Reinforcement Learning from Human Feedback (RLHF) uses human preferences to train AI models, improving alignment with human values and desired behaviors.',
      term: 'RLHF',
      tlDr: 'Training AI models using human feedback to improve alignment.',
    },
    {
      description:
        'Retrieval-augmented generation (RAG) combines AI language models with external knowledge sources, enabling more accurate and up-to-date responses.',
      term: 'RAG',
      tlDr: 'Combining AI models with external knowledge for better responses.',
    },
    {
      description:
        'Real-time inference enables AI models to provide immediate responses to user queries, essential for interactive applications and user experience.',
      term: 'Real-Time Inference',
      tlDr: 'AI models providing immediate responses for interactive applications.',
    },
  ],
  S: [
    {
      description:
        'Semantic search enables finding information based on meaning rather than exact text matches, using AI embeddings to understand query intent and content relevance.',
      term: 'Semantic Search',
      tlDr: 'Finding information based on meaning using AI understanding.',
    },
    {
      description:
        'Supervised learning trains AI models using labeled examples, where the correct output is provided for each input, enabling learning of input-output mappings.',
      term: 'Supervised Learning',
      tlDr: 'Training AI models using labeled examples with correct outputs.',
    },
    {
      description:
        'System prompts provide context and instructions to AI models, setting behavior guidelines and ensuring consistent, appropriate responses.',
      term: 'System Prompts',
      tlDr: 'Context and instructions that guide AI model behavior and responses.',
    },
  ],
  T: [
    {
      description:
        'Tokenization breaks text into smaller units (tokens) that AI models can process, affecting model understanding and computational efficiency.',
      term: 'Tokenization',
      tlDr: 'Breaking text into smaller units for AI model processing.',
    },
    {
      description:
        'Transfer learning enables AI models to apply knowledge learned from one task to related tasks, reducing training time and improving performance.',
      term: 'Transfer Learning',
      tlDr: 'Applying knowledge from one task to related tasks for efficiency.',
    },
    {
      description:
        'Training data consists of examples used to teach AI models, including inputs and expected outputs that guide the learning process.',
      term: 'Training Data',
      tlDr: 'Examples used to teach AI models, including inputs and expected outputs.',
    },
    {
      description:
        'Training loops are iterative processes where AI models learn from data by repeatedly updating weights, evaluating performance, and adjusting parameters.',
      term: 'Training Loops',
      tlDr: 'Iterative processes where AI models learn and update weights from data.',
    },
    {
      description:
        'Temperature in AI generation controls randomness and creativity in model outputs, with lower values producing more focused responses and higher values enabling more diverse outputs.',
      term: 'Temperature',
      tlDr: 'Controls randomness and creativity in AI model generation outputs.',
    },
  ],
  U: [
    {
      description:
        'Underfitting occurs when AI models are too simple to capture the underlying patterns in data, leading to poor performance on both training and test data.',
      term: 'Underfitting',
      tlDr: 'AI models too simple to capture underlying data patterns.',
    },
    {
      description:
        'Unsupervised learning trains AI models to find patterns in data without labeled examples, discovering hidden structures and relationships.',
      term: 'Unsupervised Learning',
      tlDr: 'AI models finding patterns in data without labeled examples.',
    },
  ],
  V: [
    {
      description:
        'Vector databases store and search AI embeddings efficiently, enabling semantic search, recommendation systems, and similarity-based applications.',
      term: 'Vector Databases',
      tlDr: 'Databases for storing and searching AI embeddings efficiently.',
    },
    {
      description:
        'Version control for AI models tracks changes, experiments, and deployments, enabling reproducibility and rollback capabilities.',
      term: 'Version Control',
      tlDr: 'Tracking AI model changes, experiments, and deployments.',
    },
  ],
  W: [
    {
      description:
        'Webhook integration in AI systems enables real-time communication between AI services and external applications, supporting automated workflows and data exchange.',
      term: 'Webhook Integration',
      tlDr: 'Real-time communication between AI services and external applications.',
    },
    {
      description:
        'Workflow automation uses AI to streamline business processes, reducing manual tasks and improving efficiency through intelligent decision-making.',
      term: 'Workflow Automation',
      tlDr: 'Using AI to streamline business processes and reduce manual tasks.',
    },
  ],
  Z: [
    {
      description:
        'Zero-shot learning enables AI models to perform new tasks without specific training examples, relying on general knowledge and understanding.',
      term: 'Zero-Shot Learning',
      tlDr: 'AI models performing new tasks without specific training examples.',
    },
  ],
};

const alphabet = '123ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function GlossarySection() {
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all terms for search
  const allTerms = useMemo(() => {
    return Object.entries(aiTerms).flatMap(([letter, terms]) =>
      terms.map((term) => ({ ...term, letter })),
    );
  }, []);

  // Scroll to term when page loads with hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = decodeURIComponent(window.location.hash.slice(1)); // Remove the # symbol and decode
      if (hash) {
        console.log('Hash found:', hash);
        // Find the term in allTerms to check if it exists
        const termExists = allTerms.some((term) => term.term === hash);
        console.log('Term exists:', termExists);
        if (termExists) {
          // Small delay to ensure the component is rendered
          setTimeout(() => {
            const element = document.getElementById(hash);
            console.log('Element found:', element);
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          }, 500); // Increased delay to ensure rendering
        }
      }
    }
  }, [allTerms]);

  // Filter terms based on search query or selected letter
  const filteredTerms = useMemo(() => {
    // If there's a search query, filter all terms
    if (searchQuery.trim()) {
      return allTerms.filter(
        (term) =>
          term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.tlDr.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // If a specific letter is selected, show only that letter's terms
    if (selectedLetter && selectedLetter !== 'ALL') {
      return aiTerms[selectedLetter as keyof typeof aiTerms] || [];
    }

    // Default: show all terms
    return allTerms;
  }, [searchQuery, selectedLetter, allTerms]);

  return (
    <section className="w-full relative py-24" id="glossary">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[600px] md:h-[800px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl" />
        </div>

        {/* Hero Section */}
        <motion.div
          animate="visible"
          className="relative z-10 max-w-4xl mx-auto text-center mb-16"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUpVariants}>
            <Badge className="mb-4" variant="secondary">
              AI Terminology
            </Badge>
          </motion.div>

          <motion.div variants={fadeInUpVariants}>
            <H1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance mb-6">
              AI Glossary
            </H1>
          </motion.div>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
            variants={fadeInUpVariants}
          >
            A comprehensive guide to AI terminology and concepts. Understand the
            key terms and definitions used in AI development and integration.
          </motion.p>

          <motion.div variants={fadeInUpVariants}>
            <MetricButton
              asChild
              className="rounded-full"
              metric="glossary_view_documentation_clicked"
              properties={{
                destination: 'https://docs.untrace.sh',
                location: 'glossary_section',
                source: 'marketing_site',
              }}
              size="lg"
            >
              <a
                href="https://docs.untrace.sh"
                rel="noopener noreferrer"
                target="_blank"
              >
                View Documentation
              </a>
            </MetricButton>
          </motion.div>
        </motion.div>

        {/* Main Content with Sidebar */}
        <motion.div
          animate="visible"
          className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6"
          initial="hidden"
          variants={staggerContainer}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Sidebar */}
            <motion.div
              className="w-full md:w-64 flex-shrink-0"
              variants={fadeInUpVariants}
            >
              <div className="sticky top-15">
                <H2 className="text-lg font-semibold mb-4 text-center md:text-left">
                  Find a term
                </H2>
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    type="text"
                    value={searchQuery}
                  />
                </div>

                {/* Alphabet Navigation */}
                <div className="flex flex-wrap gap-1">
                  {/* ALL button */}
                  <button
                    className={`px-2 py-1 text-sm font-medium transition-all duration-200 rounded ${
                      selectedLetter === 'ALL'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    key="ALL"
                    onClick={() => setSelectedLetter('ALL')}
                    type="button"
                  >
                    ALL
                  </button>

                  {alphabet.map((letter) => {
                    const hasTerms =
                      aiTerms[letter as keyof typeof aiTerms]?.length > 0;
                    return (
                      <button
                        className={`px-2 py-1 rounded text-sm font-medium transition-all duration-200 ${
                          !hasTerms
                            ? 'text-muted-foreground/40 cursor-not-allowed'
                            : selectedLetter === letter
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                        disabled={!hasTerms}
                        key={letter}
                        onClick={() => hasTerms && setSelectedLetter(letter)}
                        type="button"
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Terms Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTerms.map((term, index) => (
                  <motion.div
                    id={term.term}
                    key={`${term.term}-${index}`}
                    variants={fadeInUpVariants}
                  >
                    <Card className="p-0 max-w-sm w-full shadow-none border-none h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                      <button
                        aria-label={`View details for ${term.term}`}
                        className="w-full h-full text-left bg-transparent border-none p-0 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => {
                          const url = new URL(window.location.href);
                          url.hash = `#${term.term}`;
                          window.history.pushState({}, '', url);
                        }}
                        type="button"
                      >
                        <MagicCard
                          className="p-0 h-full flex flex-col"
                          gradientColor="var(--muted)"
                          gradientFrom="var(--primary)"
                          gradientOpacity={0.6}
                          gradientTo="var(--secondary)"
                        >
                          <CardHeader className="border-b border-border p-4 [.border-b]:pb-4 flex-shrink-0">
                            <CardTitle className="text-lg font-semibold text-primary mb-3">
                              {term.term}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <Badge className="text-xs" variant="outline">
                                TL;DR
                              </Badge>
                            </div>
                            <CardDescription className="text-sm leading-relaxed min-h-[60px]">
                              {term.tlDr}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <CardDescription className="text-sm leading-relaxed flex-1">
                              {term.description}
                            </CardDescription>
                          </CardContent>
                        </MagicCard>
                      </button>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* No Terms Message */}
              {filteredTerms.length === 0 && (
                <motion.div
                  className="text-center py-12"
                  variants={fadeInUpVariants}
                >
                  <P className="text-muted-foreground">
                    {searchQuery
                      ? `No AI terms found matching "${searchQuery}". Try a different search term.`
                      : selectedLetter === 'ALL'
                        ? 'No AI terms found. Check back soon for more terms!'
                        : `No AI terms found for letter "${selectedLetter}". Check back soon for more terms!`}
                  </P>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          animate="visible"
          className="relative z-10 max-w-2xl mx-auto text-center mt-16"
          initial="hidden"
          variants={fadeInUpVariants}
        >
          <H2 className="text-2xl md:text-3xl font-medium tracking-tighter mb-4">
            Need help with AI?
          </H2>
          <P className="text-muted-foreground mb-6">
            Start building with Untrace today and get real-time AI testing and
            management.
          </P>
          <MetricButton
            asChild
            className="rounded-full"
            metric="glossary_get_started_clicked"
            properties={{
              destination: '/app/onboarding',
              location: 'glossary_section',
              source: 'marketing_site',
            }}
          >
            <a href="/app/onboarding">Get Started with Untrace</a>
          </MetricButton>
        </motion.div>
      </div>
    </section>
  );
}
