// Interfaz para representar los nutrientes
export interface Nutrient {
    nutrientName: string; // Nombre del nutriente (por ejemplo, "Energy")
    value: number; // Valor del nutriente
    unitName: string; // Unidad del nutriente (por ejemplo, "kcal" para calorías)
}

// Interfaz para representar los alimentos
export interface Food {
    description: string; // Descripción del alimento
    foodNutrients: Nutrient[]; // Nutrientes del alimento
    selectedMeal?: string; // Identificador de la comida a la que está asociado
    amountInGrams?: number; // Cantidad de alimento en gramos
    id?:string;//;
}

// Interfaz para representar una comida
export interface Meal {
    name: string; // Nombre de la comida (desayuno, almuerzo, cena, etc.)
    foods: Food[]; // Array de alimentos que componen la comida
    totalCalories: number; // Calorías totales de la comida
    totalProteins?: number; // Calorías totales de proteínas
    totalCarbs?: number; // Calorías totales de carbohidratos
    totalFats?: number; // Calorías totales de grasas
}

// Interfaz para representar las comidas de un usuario
export interface UserMeals {
    userId: string; // ID del usuario
    meals: Meal[]; // Array de comidas
}
