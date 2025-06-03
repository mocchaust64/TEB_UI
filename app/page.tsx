import Hero from "@/components/hero"
import { TokenExtensionFeatures } from "@/components/token-extension-features"
import { CommonLayout } from "@/components/common-layout"

export default function Home() {
  return (
    <CommonLayout>
      <Hero />
      <TokenExtensionFeatures />
    </CommonLayout>
  )
}
