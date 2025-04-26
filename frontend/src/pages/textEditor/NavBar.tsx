import { Menubar } from "@/components/ui/menubar"

export const NevBar = () => {
    return(
        <nav className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
                <div className="flex flex-col">
                    <div className="flex">
                        <Menubar className="border-none bg-transparent shadow-none h-auto p-0">
                            
                        </Menubar>
                    </div>
                </div>
            </div>
        </nav>
    )
}