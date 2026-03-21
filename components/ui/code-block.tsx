"use client"

import {
    type LucideIcon,
    Braces,
    FileCode,
    FileCode2,
    FileJson,
    FileText,
    Check,
    Copy,
} from "lucide-react"
import type { ComponentProps, HTMLAttributes, ReactElement, ReactNode } from "react"
import {
    cloneElement,
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type BundledLanguage = string

function filenameToIcon(filename: string): LucideIcon {
    const lower = filename.toLowerCase()
    if (lower.endsWith(".tsx") || lower.endsWith(".jsx")) return FileCode2
    if (lower.endsWith(".ts")) return FileCode
    if (lower.endsWith(".json")) return FileJson
    if (lower.endsWith(".css") || lower.endsWith(".scss") || lower.endsWith(".sass")) return FileCode
    if (lower.endsWith(".md") || lower.endsWith(".mdx")) return FileText
    if (lower.endsWith(".html")) return FileCode2
    if (lower.endsWith(".py")) return Braces
    return FileCode2
}

function useControllableState<T>({
    prop,
    defaultProp,
    onChange,
}: {
    prop?: T
    defaultProp: T
    onChange?: (value: T) => void
}): [T, (next: T | ((prev: T) => T)) => void] {
    const [uncontrolled, setUncontrolled] = useState(defaultProp)
    const isControlled = prop !== undefined
    const value = (isControlled ? prop : uncontrolled) as T

    const setValue = useCallback(
        (next: T | ((prev: T) => T)) => {
            const nextValue =
                typeof next === "function" ? (next as (prev: T) => T)(value) : next
            if (!isControlled) {
                setUncontrolled(nextValue)
            }
            onChange?.(nextValue)
        },
        [isControlled, onChange, value],
    )

    return [value, setValue]
}

const lineNumberClassNames = cn(
    "[&_code]:[counter-reset:line]",
    "[&_code]:[counter-increment:line_0]",
    "[&_.line]:before:content-[counter(line)]",
    "[&_.line]:before:inline-block",
    "[&_.line]:before:[counter-increment:line]",
    "[&_.line]:before:w-4",
    "[&_.line]:before:mr-4",
    "[&_.line]:before:text-[13px]",
    "[&_.line]:before:text-right",
    "[&_.line]:before:text-muted-foreground/50",
    "[&_.line]:before:font-mono",
    "[&_.line]:before:select-none",
)

const darkModeClassNames = cn(
    "dark:[&_.shiki]:!text-[var(--shiki-dark)]",
    "dark:[&_.shiki]:!bg-[var(--shiki-dark-bg)]",
    "dark:[&_.shiki]:![font-style:var(--shiki-dark-font-style)]",
    "dark:[&_.shiki]:![font-weight:var(--shiki-dark-font-weight)]",
    "dark:[&_.shiki]:![text-decoration:var(--shiki-dark-text-decoration)]",
    "dark:[&_.shiki_span]:!text-[var(--shiki-dark)]",
    "dark:[&_.shiki_span]:![font-style:var(--shiki-dark-font-style)]",
    "dark:[&_.shiki_span]:![font-weight:var(--shiki-dark-font-weight)]",
    "dark:[&_.shiki_span]:![text-decoration:var(--shiki-dark-text-decoration)]",
)

const lineHighlightClassNames = cn(
    "[&_.line.highlighted]:bg-blue-50",
    "[&_.line.highlighted]:after:bg-blue-500",
    "[&_.line.highlighted]:after:absolute",
    "[&_.line.highlighted]:after:left-0",
    "[&_.line.highlighted]:after:top-0",
    "[&_.line.highlighted]:after:bottom-0",
    "[&_.line.highlighted]:after:w-0.5",
    "dark:[&_.line.highlighted]:!bg-blue-500/10",
)

const lineDiffClassNames = cn(
    "[&_.line.diff]:after:absolute",
    "[&_.line.diff]:after:left-0",
    "[&_.line.diff]:after:top-0",
    "[&_.line.diff]:after:bottom-0",
    "[&_.line.diff]:after:w-0.5",
    "[&_.line.diff.add]:bg-emerald-50",
    "[&_.line.diff.add]:after:bg-emerald-500",
    "[&_.line.diff.remove]:bg-rose-50",
    "[&_.line.diff.remove]:after:bg-rose-500",
    "dark:[&_.line.diff.add]:!bg-emerald-500/10",
    "dark:[&_.line.diff.remove]:!bg-rose-500/10",
)

const lineFocusedClassNames = cn(
    "[&_code:has(.focused)_.line]:blur-[2px]",
    "[&_code:has(.focused)_.line.focused]:blur-none",
)

const wordHighlightClassNames = cn(
    "[&_.highlighted-word]:bg-blue-50",
    "dark:[&_.highlighted-word]:!bg-blue-500/10",
)

const codeBlockClassName = cn(
    "mt-0 bg-background text-sm",
    "[&_pre]:py-4",
    "[&_.shiki]:!bg-[var(--shiki-bg)]",
    "[&_code]:w-full",
    "[&_code]:grid",
    "[&_code]:overflow-x-auto",
    "[&_code]:bg-transparent",
    "[&_.line]:px-4",
    "[&_.line]:w-full",
    "[&_.line]:relative",
)

interface CodeBlockData {
    language: string
    filename: string
    code: string
}

interface CodeBlockContextType {
    value: string | undefined
    onValueChange: ((value: string) => void) | undefined
    data: CodeBlockData[]
}

const CodeBlockContext = createContext<CodeBlockContextType>({
    value: undefined,
    onValueChange: undefined,
    data: [],
})

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    data: CodeBlockData[]
}

export const CodeBlock = ({
    value: controlledValue,
    onValueChange: controlledOnValueChange,
    defaultValue,
    className,
    data,
    children,
    ...props
}: CodeBlockProps) => {
    const first = data[0]?.language ?? ""
    const [value, onValueChange] = useControllableState({
        defaultProp: defaultValue ?? first,
        prop: controlledValue,
        onChange: controlledOnValueChange,
    })

    return (
        <CodeBlockContext.Provider value={{ value, onValueChange, data }}>
            <div
                className={cn("size-full overflow-hidden rounded-md border", className)}
                {...props}
            >
                {children}
            </div>
        </CodeBlockContext.Provider>
    )
}

export type CodeBlockHeaderProps = HTMLAttributes<HTMLDivElement>

export const CodeBlockHeader = ({ className, ...props }: CodeBlockHeaderProps) => (
    <div
        className={cn("flex flex-row items-center border-b bg-secondary p-1", className)}
        {...props}
    />
)

export type CodeBlockFilesProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children: (item: CodeBlockData) => ReactNode
}

export const CodeBlockFiles = ({ className, children, ...props }: CodeBlockFilesProps) => {
    const { data } = useContext(CodeBlockContext)

    return (
        <div className={cn("flex grow flex-row items-center gap-2", className)} {...props}>
            {data.map(children)}
        </div>
    )
}

export type CodeBlockFilenameProps = HTMLAttributes<HTMLDivElement> & {
    icon?: LucideIcon
    value?: string
}

export const CodeBlockFilename = ({
    className,
    icon,
    value,
    children,
    ...props
}: CodeBlockFilenameProps) => {
    const { value: activeValue } = useContext(CodeBlockContext)
    const label = typeof children === "string" ? children : ""
    const IconComponent = icon ?? (label ? filenameToIcon(label) : FileCode2)

    if (value !== activeValue) {
        return null
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2 bg-secondary px-4 py-1.5 text-muted-foreground text-xs",
                className,
            )}
            {...props}
        >
            {createElement(IconComponent, {
                className: "h-4 w-4 shrink-0",
                "aria-hidden": true,
            })}
            <span className="flex-1 truncate">{children}</span>
        </div>
    )
}

export type CodeBlockSelectProps = ComponentProps<typeof Select>

export const CodeBlockSelect = (props: CodeBlockSelectProps) => {
    const { value, onValueChange } = useContext(CodeBlockContext)

    return <Select onValueChange={onValueChange} value={value} {...props} />
}

export type CodeBlockSelectTriggerProps = ComponentProps<typeof SelectTrigger>

export const CodeBlockSelectTrigger = ({ className, ...props }: CodeBlockSelectTriggerProps) => (
    <SelectTrigger
        className={cn("w-fit border-none text-muted-foreground text-xs shadow-none", className)}
        {...props}
    />
)

export type CodeBlockSelectValueProps = ComponentProps<typeof SelectValue>

export const CodeBlockSelectValue = (props: CodeBlockSelectValueProps) => <SelectValue {...props} />

export type CodeBlockSelectContentProps = Omit<ComponentProps<typeof SelectContent>, "children"> & {
    children: (item: CodeBlockData) => ReactNode
}

export const CodeBlockSelectContent = ({ children, ...props }: CodeBlockSelectContentProps) => {
    const { data } = useContext(CodeBlockContext)

    return <SelectContent {...props}>{data.map(children)}</SelectContent>
}

export type CodeBlockSelectItemProps = ComponentProps<typeof SelectItem>

export const CodeBlockSelectItem = ({ className, ...props }: CodeBlockSelectItemProps) => (
    <SelectItem className={cn("text-sm", className)} {...props} />
)

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
    onCopy?: () => void
    onError?: (error: Error) => void
    timeout?: number
}

export const CodeBlockCopyButton = ({
    asChild,
    onCopy,
    onError,
    timeout = 2000,
    children,
    className,
    ...props
}: CodeBlockCopyButtonProps) => {
    const [isCopied, setIsCopied] = useState(false)
    const { data, value } = useContext(CodeBlockContext)
    const code = data.find((item) => item.language === value)?.code

    const copyToClipboard = () => {
        if (typeof window === "undefined" || !navigator.clipboard?.writeText || !code) {
            return
        }

        navigator.clipboard.writeText(code).then(
            () => {
                setIsCopied(true)
                onCopy?.()
                setTimeout(() => setIsCopied(false), timeout)
            },
            (err: unknown) => {
                const error = err instanceof Error ? err : new Error(String(err))
                onError?.(error)
            },
        )
    }

    if (asChild && children) {
        return cloneElement(children as ReactElement<{ onClick?: () => void }>, {
            onClick: copyToClipboard,
        })
    }

    const Icon = isCopied ? Check : Copy

    return (
        <Button
            className={cn("shrink-0", className)}
            onClick={copyToClipboard}
            size="icon"
            type="button"
            variant="ghost"
            {...props}
        >
            {children ?? <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
        </Button>
    )
}

type CodeBlockFallbackProps = HTMLAttributes<HTMLDivElement>

const CodeBlockFallback = ({ children, ...props }: CodeBlockFallbackProps) => (
    <div {...props}>
        <pre className="w-full">
            <code>
                {children
                    ?.toString()
                    .split("\n")
                    .map((line, i) => (
                        <span className="line" key={`${i}:${line}`}>
                            {line}
                        </span>
                    ))}
            </code>
        </pre>
    </div>
)

export type CodeBlockBodyProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children: (item: CodeBlockData) => ReactNode
}

export const CodeBlockBody = ({ children, ...props }: CodeBlockBodyProps) => {
    const { data } = useContext(CodeBlockContext)

    return <div {...props}>{data.map(children)}</div>
}

export type CodeBlockItemProps = HTMLAttributes<HTMLDivElement> & {
    value: string
    lineNumbers?: boolean
}

export const CodeBlockItem = ({
    children,
    lineNumbers = true,
    className,
    value,
    ...props
}: CodeBlockItemProps) => {
    const { value: activeValue } = useContext(CodeBlockContext)

    if (value !== activeValue) {
        return null
    }

    return (
        <div
            className={cn(
                codeBlockClassName,
                lineHighlightClassNames,
                lineDiffClassNames,
                lineFocusedClassNames,
                wordHighlightClassNames,
                darkModeClassNames,
                lineNumbers && lineNumberClassNames,
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export type CodeBlockContentProps = HTMLAttributes<HTMLDivElement> & {
    themes?: {
        light: string
        dark: string
    }
    language?: BundledLanguage
    syntaxHighlighting?: boolean
    children: string
}

export const CodeBlockContent = ({
    children,
    themes = {
        light: "vitesse-light",
        dark: "vitesse-dark",
    },
    language = "typescript",
    syntaxHighlighting = true,
    className,
    ...props
}: CodeBlockContentProps) => {
    const [highlightedCode, setHighlightedCode] = useState<string>("")
    const [isLoading, setIsLoading] = useState(syntaxHighlighting)

    useEffect(() => {
        if (!syntaxHighlighting) {
            setIsLoading(false)
            return
        }

        let cancelled = false

        const loadHighlightedCode = async () => {
            try {
                const { codeToHtml } = await import("shiki")

                const html = await codeToHtml(children, {
                    lang: language,
                    themes: {
                        light: themes.light,
                        dark: themes.dark,
                    },
                })

                if (cancelled) {
                    return
                }

                requestAnimationFrame(() => {
                    if (!cancelled) {
                        setHighlightedCode(html)
                        setIsLoading(false)
                    }
                })
            } catch (error) {
                console.error(`Failed to highlight code for language "${language}":`, error)
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        const rafId = requestAnimationFrame(() => {
            loadHighlightedCode()
        })

        return () => {
            cancelled = true
            cancelAnimationFrame(rafId)
        }
    }, [children, language, themes.dark, themes.light, syntaxHighlighting])

    if (!syntaxHighlighting || isLoading) {
        return (
            <CodeBlockFallback className={className} {...props}>
                {children}
            </CodeBlockFallback>
        )
    }

    return (
        <div
            className={className}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki HTML output
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            {...props}
        />
    )
}
