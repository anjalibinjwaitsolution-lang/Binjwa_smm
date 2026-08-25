"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AIPreferencesTab() {
  const [creativity, setCreativity] = useState(65)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">AI Preferences</h2>
        <p className="text-foreground-muted">Customize how AI generates your content</p>
      </div>

      {/* Model Selection */}
      <div className="bg-background rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-heading font-bold text-foreground">Text Generation Model</h3>
        <Select defaultValue="gpt4">
          <SelectTrigger className="h-14 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt4">
              <div className="py-2">
                <div className="font-semibold">GPT-4 Turbo</div>
                <div className="text-sm text-foreground-muted">Most advanced, best for complex content</div>
              </div>
            </SelectItem>
            <SelectItem value="claude">
              <div className="py-2">
                <div className="font-semibold">Claude Sonnet</div>
                <div className="text-sm text-foreground-muted">Great balance of speed and quality</div>
              </div>
            </SelectItem>
            <SelectItem value="gemini">
              <div className="py-2">
                <div className="font-semibold">Gemini Pro</div>
                <div className="text-sm text-foreground-muted">Fast and efficient</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Generation */}
      <div className="bg-background rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-heading font-bold text-foreground">Image Generation</h3>
        <Select defaultValue="dalle">
          <SelectTrigger className="h-14 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dalle">DALL-E 3</SelectItem>
            <SelectItem value="sd">Stable Diffusion XL</SelectItem>
            <SelectItem value="midjourney">Midjourney</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Creativity Slider */}
      <div className="bg-background rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-heading font-bold text-foreground">Content Creativity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Conservative</span>
            <span className="font-bold text-2xl gradient-text">{creativity}%</span>
            <span className="text-foreground-muted">Creative</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={creativity}
            onChange={(e) => setCreativity(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${creativity}%, #e5e7eb ${creativity}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      </div>

      {/* Defaults */}
      <div className="bg-background rounded-2xl shadow-sm p-6 space-y-6">
        <h3 className="text-xl font-heading font-bold text-foreground">Default Settings</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select defaultValue="en">
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content Length</Label>
            <div className="flex gap-2">
              {["Short", "Medium", "Long"].map((length) => (
                <button
                  key={length}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    length === "Medium"
                      ? "gradient-primary text-white shadow-lg"
                      : "bg-background-subtle text-foreground hover:bg-background-muted"
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-background-subtle">
            <div>
              <div className="font-medium text-foreground">Auto-generate hashtags</div>
              <div className="text-sm text-foreground-muted">Include relevant hashtags by default</div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-background-subtle">
            <div>
              <div className="font-medium text-foreground">Include emojis</div>
              <div className="text-sm text-foreground-muted">Add emojis to make content more engaging</div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 h-12 rounded-xl bg-transparent">
          Reset to Defaults
        </Button>
        <Button className="flex-1 h-12 rounded-xl btn-gradient">Save Preferences</Button>
      </div>
    </div>
  )
}
