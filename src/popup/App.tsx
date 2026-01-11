function Popup() {
    return (
        <div className="w-[500px] h-[500px] bg-background text-foreground p-4 flex flex-col items-center justify-center border">
            <h1 className="text-2xl font-bold mb-4">Popup</h1>
            <p className="text-muted-foreground text-center">
                This is your extension popup.
            </p>
        </div>
    )
}

export default Popup
