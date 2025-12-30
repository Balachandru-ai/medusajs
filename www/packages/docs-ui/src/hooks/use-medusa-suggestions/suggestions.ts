import { ColoredMedusaIcon } from "../../components/Icons/ColoredMedusa"
import { CardProps } from "../../components/Card"

const CLOUD_SUGGESTION: CardProps = {
  title: "Deploy to Cloud",
  text: "Deploy and manage production-ready Medusa applications with zero-configuration deployments, automatic scaling, and GitHub integration, and more.",
  href: "https://cloud.medusajs.com/signup",
  icon: ColoredMedusaIcon,
}

const CLOUD_MAIL_SUGGESTION: CardProps = {
  title: "Deploy to Cloud",
  text: "Deploy to Cloud with email sending support out-of-the-box.",
  href: "https://cloud.medusajs.com/signup",
  icon: ColoredMedusaIcon,
}

type Suggestions = Map<string, CardProps>

export const medusaSuggestions: Suggestions = new Map([
  ["railway", CLOUD_SUGGESTION],
  ["heroku", CLOUD_SUGGESTION],
  ["aws", CLOUD_SUGGESTION],
  ["coolify", CLOUD_SUGGESTION],
  ["resend", CLOUD_MAIL_SUGGESTION],
  ["sendgrid", CLOUD_MAIL_SUGGESTION],
])
