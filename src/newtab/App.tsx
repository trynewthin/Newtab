import { BackgroundLayer } from "./layers/BackgroundLayer";
import { ContentLayer } from "./layers/ContentLayer";
import { FloatLayer } from "./layers/FloatLayer";

export function App() {
    return (
        <div className="relative w-full h-full overflow-hidden">
            <BackgroundLayer />
            <ContentLayer />
            <FloatLayer />
        </div>
    );
}

export default App;