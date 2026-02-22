async function test() {
    try {
        const res = await fetch("http://localhost:5173/api/clinics/nearby?lat=0&lng=0");
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (err) {
        console.error("Error connecting:", err);
    }
}
test();
