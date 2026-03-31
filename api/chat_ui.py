import gradio as gr
from agents.crm_chat.agent import chat

EXAMPLES = [
    "Qualify this lead: Priya Sharma, CTO at CloudScale SaaS (200 employees), she downloaded our Salesforce automation whitepaper.",
    "I have 3 leads: 1) Rahul Gupta, VP Sales at TechCorp (500 employees) 2) Sneha Patel, intern at a startup 3) Arjun Mehta, CEO at ManufacturingPlus (1000 employees). Score them for a B2B SaaS product.",
    "Write a cold outreach email for a Hot lead who is a VP of Engineering interested in Salesforce automation.",
    "What questions should I ask a lead to qualify them faster?",
    "My lead went cold after the demo. What should I do?",
]


async def respond(message: str, history: list[dict]):
    # history is already in openai format: [{"role": ..., "content": ...}]
    reply = await chat(message, history)
    return reply


def build_ui() -> gr.Blocks:
    with gr.Blocks(
        title="CRM AI Agent — salesforceninja.dev",
        theme=gr.themes.Soft(
            primary_hue="blue",
            secondary_hue="indigo",
        ),
        css="""
        .header { text-align: center; padding: 20px 0 10px 0; }
        .header h1 { font-size: 1.8rem; font-weight: 700; color: #1e40af; margin: 0; }
        .header p { color: #6b7280; margin: 6px 0 0 0; font-size: 0.95rem; }
        footer { display: none !important; }
        """,
    ) as demo:

        gr.HTML("""
        <div class="header">
            <h1>🤖 CRM AI Agent</h1>
            <p>Qualify leads · Score prospects · Draft outreach · Get sales advice</p>
            <p style="font-size:0.8rem; color:#9ca3af;">Powered by salesforceninja.dev</p>
        </div>
        """)

        chatbot = gr.ChatInterface(
            fn=respond,
            type="messages",
            chatbot=gr.Chatbot(
                height=480,
                placeholder="<p style='text-align:center; color:#9ca3af;'>Ask me to qualify leads, score prospects, draft emails, or answer CRM questions.</p>",
                show_label=False,
            ),
            textbox=gr.Textbox(
                placeholder="e.g. Qualify: John Doe, VP Sales at Acme Corp, 300 employees, asked for a demo...",
                show_label=False,
                lines=2,
                max_lines=6,
            ),
            examples=EXAMPLES,
            submit_btn="Send",
            retry_btn=None,
            undo_btn=None,
            clear_btn="Clear Chat",
        )

    return demo
